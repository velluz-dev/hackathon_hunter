import type { RawHackathon } from "../types";

// Hand-picked events that no scraper covers, usually announced only on Facebook or
// government news sites. Add one entry per event; it disappears on its own after `hideAfter`.
// Leave the dates null while they're unannounced and the card shows "Dates TBA".
interface CuratedEvent extends Omit<RawHackathon, "source"> {
  /** Stop listing it after this moment (ISO), so finished or stale entries clean themselves up. */
  hideAfter: string;
}

const EVENTS: CuratedEvent[] = [
  {
    id: "curated:science-festival-2026-yangon",
    title: "Science Festival 2026 · Yangon Technological University (YTU)",
    // 2025 edition write-up; swap in this year's announcement once it's posted.
    url: "https://atommedia.online/en/press-releases/rosatom-provel-v-myanme-iii-festival-nauki/",
    image: null,
    // Dates not announced yet. Last year: Nov 24–28, 2025 (Nay Pyi Taw, then Yangon/YTU).
    startDate: null,
    endDate: null,
    deadline: null,
    deadlineLabel: "Starts",
    location: "Yangon Technological University, Yangon, Myanmar",
    mode: "in-person",
    prizeUsd: null,
    themes: ["Science", "Nuclear technology", "HackAtom", "Expected late Nov"],
    participants: null,
    organizer: "Rosatom & Ministry of Science and Technology",
    hideAfter: "2026-12-31T00:00:00Z",
  },
];

export async function fetchCurated(): Promise<RawHackathon[]> {
  const now = Date.now();
  return EVENTS.filter((e) => Date.parse(e.hideAfter) > now).map((e) => {
    const h: RawHackathon & { hideAfter?: string } = { ...e, source: "curated" };
    delete h.hideAfter;
    return h;
  });
}
