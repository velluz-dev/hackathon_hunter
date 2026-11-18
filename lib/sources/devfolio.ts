import { plainText } from "../text";
import type { RawHackathon } from "../types";

// Devfolio hosts most hackathons in India and many across Asia (ETHChiangmai, ETHIndia…).
// Its listing pages search a public API, one query per tab: open for applications, and
// upcoming (applications not open yet).
const API = "https://api.devfolio.co/api/search/hackathons";
const TABS = ["application_open", "upcoming"];
const PAGE_SIZE = 100;
const SUBDOMAIN = /^[a-z0-9-]+$/i;

interface DevfolioHackathon {
  uuid: string;
  name: string;
  slug: string;
  tagline: string | null;
  desc: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_online: boolean;
  city: string | null;
  country: string | null;
  location: string | null;
  cover_img: string | null;
  themes: { name: string }[] | null;
  participants_count: number | null;
  private: boolean;
  hackathon_setting: { logo: string | null; reg_ends_at: string | null; subdomain: string | null } | null;
  sponsor_tiers: { sponsors: { name: string | null; company: { name: string | null } | null }[] }[] | null;
}

interface SearchResult {
  hits?: { hits?: { _source: DevfolioHackathon }[] };
}

const iso = (s: string | null | undefined) => (s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null);

function normalize(h: DevfolioHackathon): RawHackathon {
  const s = h.hackathon_setting;
  const sub = [s?.subdomain, h.slug].find((x) => x && SUBDOMAIN.test(x));
  const start = iso(h.starts_at);
  const applyBy = iso(s?.reg_ends_at);
  const place = [h.city, h.country].filter(Boolean).join(", ");
  const sponsors = (h.sponsor_tiers ?? []).flatMap((t) => (t.sponsors ?? []).map((x) => (x.company?.name ?? x.name ?? "").trim()));
  return {
    id: `devfolio:${h.uuid}`,
    source: "devfolio",
    title: h.name.trim(),
    url: sub ? `https://${sub}.devfolio.co/` : "https://devfolio.co/hackathons",
    image: s?.logo || h.cover_img || null,
    startDate: start,
    endDate: iso(h.ends_at),
    deadline: applyBy ?? start,
    deadlineLabel: applyBy ? "Applications close" : "Starts",
    location: h.is_online ? "Online" : place || h.location || "TBA",
    mode: h.is_online ? "online" : "in-person",
    prizeUsd: null,
    themes: (h.themes ?? []).map((t) => t.name).filter(Boolean),
    participants: h.participants_count || null,
    organizer: null,
    sponsors: [...new Set(sponsors.filter(Boolean))],
    description: plainText(h.desc) ?? h.tagline ?? null,
  };
}

async function search(type: string): Promise<DevfolioHackathon[]> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 (HackathonHunter)" },
    body: JSON.stringify({ type, from: 0, size: PAGE_SIZE }),
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Devfolio responded ${res.status}`);
  const data = (await res.json()) as SearchResult;
  if (!Array.isArray(data.hits?.hits)) throw new Error("Devfolio response changed (no hits)");
  return data.hits.hits.map((x) => x._source);
}

export async function fetchDevfolio(): Promise<RawHackathon[]> {
  const seen = new Set<string>();
  return (await Promise.all(TABS.map(search)))
    .flat()
    .filter((h) => {
      if (!h?.uuid || h.private || seen.has(h.uuid)) return false;
      seen.add(h.uuid);
      return true;
    })
    .map(normalize);
}
