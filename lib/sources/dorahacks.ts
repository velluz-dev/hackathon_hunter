import type { RawHackathon } from "../types";

// DoraHacks runs web3, AI and frontier-tech hackathons, mostly online, often with big prize
// pools. Its hub lists live hackathons first and finished ones after, so we page until a page
// has nothing live left.
const API = "https://dorahacks.io/api/v1/hub/hackathons";
const PAGE_SIZE = 50;
const MAX_PAGES = 4;
const USD = /^(usd|usdc|usdt)$/i;
// Placeholder venues ("Address will be disclosed to approved attendees only", "To be announced").
const HIDDEN_VENUE = /disclos|approved attendees|to be announced|\btb[ad]\b/i;

interface DoraHackathon {
  id: number;
  uname: string | null;
  title: string;
  image_url: string | null;
  tags: string | null; // "AI,DeFi,Web3"
  owner: { name: string | null } | null;
  timeline_start: number | null; // unix seconds
  timeline_end: number | null;
  venue_form: string | null; // "Virtual" | "IRL"
  venue_name: string | null;
  venue_address: string | null;
  bonus_price: number | null;
  bonus_token: string | null;
  hackers_count: number | null;
}

const iso = (seconds: number | null) => (seconds ? new Date(seconds * 1000).toISOString() : null);

function normalize(h: DoraHackathon): RawHackathon {
  const form = h.venue_form ?? "";
  const online = /virtual|online/i.test(form);
  const hybrid = /hybrid/i.test(form);
  const venue = [h.venue_address, h.venue_name].find((v) => v && v.trim() && !HIDDEN_VENUE.test(v));
  // Tags repeat with different casing ("AI", "ai"); keep the first spelling of each.
  const tags = new Map<string, string>();
  for (const t of (h.tags ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
    if (!tags.has(t.toLowerCase())) tags.set(t.toLowerCase(), t);
  }
  return {
    id: `dorahacks:${h.id}`,
    source: "dorahacks",
    title: h.title.trim(),
    url: `https://dorahacks.io/hackathon/${encodeURIComponent(h.uname || String(h.id))}`,
    image: h.image_url || null,
    startDate: iso(h.timeline_start),
    endDate: iso(h.timeline_end),
    deadline: iso(h.timeline_end),
    deadlineLabel: "Submissions close",
    location: online ? "Online" : (venue?.trim() ?? "TBA"),
    mode: hybrid ? "hybrid" : online ? "online" : "in-person",
    prizeUsd: h.bonus_price && h.bonus_price > 0 && USD.test(h.bonus_token ?? "") ? h.bonus_price : null,
    themes: [...tags.values()].slice(0, 10),
    participants: h.hackers_count || null,
    organizer: h.owner?.name?.trim() || null,
  };
}

export async function fetchDoraHacks(): Promise<RawHackathon[]> {
  const now = Date.now() / 1000;
  const all: DoraHackathon[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${API}?page=${page}&page_size=${PAGE_SIZE}`, {
      headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(`DoraHacks responded ${res.status}`);
    const data = (await res.json()) as { results?: DoraHackathon[]; next?: string | null };
    if (!Array.isArray(data.results)) throw new Error("DoraHacks response changed (no results)");
    all.push(...data.results);
    if (!data.next || !data.results.some((h) => (h.timeline_end ?? 0) > now)) break;
  }
  const seen = new Set<number>();
  return all
    .filter((h) => {
      if (!h?.title || seen.has(h.id) || !h.timeline_end || h.timeline_end <= now) return false;
      seen.add(h.id);
      return true;
    })
    .map(normalize);
}
