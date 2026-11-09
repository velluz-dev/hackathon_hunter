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
  {
    id: "curated:code2career-2026-yangon",
    title: "Code2Career Hackathon 2026 · Mandalay",
    // Announcement post (Facebook only). It has the application form, info deck and the
    // Nov 19 online info session link. Free; accommodation provided for out-of-town teams.
    // Who can apply: Myanmar nationals living in Myanmar, aged 28 or under in Jan 2027, with basic
    // web/mobile skills. Cash prize amounts not announced yet. Venue in Mandalay TBA.
    url: "https://www.facebook.com/IHYangon/posts/1576684397830905/",
    image: null,
    // 6-day hackathon Jan 24–29, 2027, then Demo Day & job matching with 10+ Japanese IT companies on Jan 30 (MMT).
    startDate: "2027-01-23T17:30:00Z",
    endDate: "2027-01-30T17:29:00Z",
    // Applications close Wed, Nov 25, 2026, 11:59 PM Myanmar time (UTC+6:30).
    deadline: "2026-11-25T17:29:00Z",
    deadlineLabel: "Applications close",
    location: "Mandalay, Myanmar",
    mode: "in-person",
    prizeUsd: null,
    themes: ["Web & mobile", "Careers", "Japanese IT companies", "Free", "Ages 28 and under"],
    participants: null,
    organizer: "Myanmar-Japan Center (MJC) & Impact Hub Yangon",
    hideAfter: "2027-01-31T00:00:00Z",
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
