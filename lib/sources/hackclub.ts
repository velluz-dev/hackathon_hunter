import type { RawHackathon } from "../types";

// Hack Club keeps a public list of upcoming high school hackathons around the world.
const API = "https://hackathons.hackclub.com/api/events/upcoming";

interface HackClubEvent {
  id: string;
  name: string;
  website: string;
  start: string;
  end: string | null;
  logo: string | null;
  banner: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  virtual: boolean;
  hybrid: boolean;
  mlhAssociated: boolean;
}

function normalize(e: HackClubEvent): RawHackathon {
  const place = [e.city, e.state, e.country].filter(Boolean).join(", ");
  return {
    id: `hackclub:${e.id}`,
    source: "hackclub",
    title: e.name.trim(),
    url: e.website,
    image: e.logo || e.banner || null,
    startDate: e.start,
    endDate: e.end,
    deadline: e.start,
    deadlineLabel: "Starts",
    location: e.virtual ? "Online" : place || "TBA",
    mode: e.virtual ? "online" : e.hybrid ? "hybrid" : "in-person",
    prizeUsd: null,
    themes: ["High school", ...(e.mlhAssociated ? ["MLH"] : [])],
    participants: null,
    organizer: null,
  };
}

export async function fetchHackClub(): Promise<RawHackathon[]> {
  const res = await fetch(API, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Hack Club responded ${res.status}`);
  const events = (await res.json()) as HackClubEvent[];
  if (!Array.isArray(events)) throw new Error("Hack Club response changed (not a list)");
  return events.filter((e) => e?.id && e.name && e.website && e.start).map(normalize);
}
