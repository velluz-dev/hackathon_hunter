import type { RawHackathon } from "../types";

// Google Developer Groups run DevFests, I/O Extended and study jams on gdg.community.dev,
// whose chapter and event lists are public JSON. We only read the chapters in Myanmar.
const SITE = "https://gdg.community.dev";
const HEADERS = { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" };
// GDG Yangon, in case the chapter search ever comes back empty.
const KNOWN_CHAPTERS = [621];

interface GdgChapter {
  id: number;
  title: string;
  country: string;
}

interface GdgEvent {
  id: number;
  title: string;
  start_date: string;
  end_date: string | null;
  static_url: string;
  picture: string | null;
  audience_type: string; // "IN_PERSON" | "VIRTUAL" | "HYBRID"
  chapter_title: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SITE}${path}`, { headers: HEADERS, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`GDG responded ${res.status}`);
  return (await res.json()) as T;
}

async function myanmarChapters(): Promise<number[]> {
  const data = await getJson<{ results?: GdgChapter[] }>("/api/search/chapter/?q=myanmar");
  const found = (data.results ?? []).filter((c) => /myanmar|burma/i.test(c.country)).map((c) => c.id);
  return [...new Set([...KNOWN_CHAPTERS, ...found])];
}

function normalize(e: GdgEvent, city: string): RawHackathon {
  const mode = e.audience_type === "VIRTUAL" ? "online" : e.audience_type === "HYBRID" ? "hybrid" : "in-person";
  // The default GDG thumbnail is the same for every event, so a letter tile reads better.
  const image = e.picture && !/DefaultEventThumbnail/.test(e.picture) ? e.picture : null;
  return {
    id: `gdg:${e.id}`,
    source: "gdg",
    title: e.title.trim(),
    url: e.static_url,
    image,
    startDate: e.start_date,
    endDate: e.end_date,
    deadline: e.start_date,
    deadlineLabel: "Starts",
    location: mode === "online" ? `Online · ${city}` : city,
    mode,
    prizeUsd: null,
    themes: ["Google"],
    participants: null,
    organizer: e.chapter_title,
  };
}

export async function fetchGdgMyanmar(): Promise<RawHackathon[]> {
  const chapters = await myanmarChapters();
  const lists = await Promise.all(
    chapters.map(async (id) => {
      const data = await getJson<{ results?: GdgEvent[] }>(
        `/api/event_slim/for_chapter/${id}/?page_size=20&status=Live&include_cohosted_events=true&visible_on_parent_chapter_only=true&order=start_date`,
      );
      return data.results ?? [];
    }),
  );
  // Chapter titles are "GDG Yangon" or "GDG on Campus <school> - <city>, Myanmar".
  return lists.flat().map((e) => {
    const city = e.chapter_title.replace(/^GDG( on Campus)?\s*/, "").split(" - ").pop() || "Myanmar";
    return normalize(e, /myanmar/i.test(city) ? city : `${city}, Myanmar`);
  });
}
