import type { RawHackathon } from "../types";

// Luma hosts many company-run and community hackathons. Its discover search is public JSON.
// Results are weighted toward events near wherever the app is running.
const SEARCH_BASE = "https://api.lu.ma/discover/get-paginated-events?pagination_limit=50";

// The search also matches meetups that only mention hackathons, so keep events named like one.
const HACKATHON_NAME = /hack|buildathon|ideathon|game ?jam|codefest/i;

interface LumaEntry {
  event: {
    api_id: string;
    name: string;
    url: string;
    start_at: string;
    end_at: string | null;
    cover_url: string | null;
    location_type: string; // "offline" | "online" | ...
    timezone?: string | null;
    geo_address_info?: {
      address?: string;
      city?: string;
      city_state?: string;
      country?: string;
      country_code?: string;
    } | null;
  };
  calendar?: {
    api_id?: string;
    name?: string;
    is_personal?: boolean;
    location?: { city?: string; country_code?: string } | null;
  } | null;
  hosts?: { name: string }[];
  guest_count?: number;
}

function normalize({ event: e, calendar, hosts, guest_count }: LumaEntry): RawHackathon {
  // Some hosts mark a virtual event "offline" and type "Virtual (Online)" as the address.
  const online = e.location_type === "online" || /virtual|online/i.test(e.geo_address_info?.address ?? "");
  const geo = e.geo_address_info;
  const city = geo?.city_state ?? geo?.city;
  // city_state often already ends with the country ("Sanchaung, Myanmar (Burma)").
  const place = [city, city?.includes(geo?.country ?? "\0") ? null : geo?.country].filter(Boolean);
  const organizers = [
    ...(calendar && !calendar.is_personal && calendar.name ? [calendar.name] : []),
    ...(hosts ?? []).map((h) => h.name),
  ];
  return {
    id: `luma:${e.api_id}`,
    source: "luma",
    title: e.name.trim(),
    url: `https://lu.ma/${e.url}`,
    image: e.cover_url,
    startDate: e.start_at,
    endDate: e.end_at,
    deadline: e.start_at,
    deadlineLabel: "Starts",
    location: online ? "Online" : [...new Set(place)].join(", ") || "TBA",
    mode: online ? "online" : "in-person",
    prizeUsd: null,
    themes: [],
    participants: guest_count || null,
    organizer: [...new Set(organizers)].join(", ") || null,
  };
}

async function search(query: string): Promise<LumaEntry[]> {
  const res = await fetch(`${SEARCH_BASE}&query=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Luma responded ${res.status}`);
  const data = (await res.json()) as { entries?: LumaEntry[] };
  if (!Array.isArray(data.entries)) throw new Error("Luma response changed (no entries)");
  return data.entries;
}

export async function fetchLuma(): Promise<RawHackathon[]> {
  return (await search("hackathon")).filter((x) => HACKATHON_NAME.test(x.event.name)).map(normalize);
}

// The general search is weighted toward wherever the server runs (the US on Vercel), so
// Myanmar events need their own searches. There are few, so every event counts, not just
// hackathons: Cursor and Grok meetups, workshops, bootcamps and competitions too.
const MYANMAR_QUERIES = ["myanmar", "yangon", "mandalay", "burma", "မြန်မာ", "ရန်ကုန်", "cursor myanmar", "grok myanmar"];
// Community calendars that post Myanmar events, read in full since search misses some.
// Myanmar calendars the searches turn up are added automatically.
const MYANMAR_CALENDARS = [
  "cal-CF7zU9zsT73svNw", // Cursor & Grok Myanmar (cursormyanmar.com)
];
const MYANMAR_TIMEZONE = /^Asia\/(Yangon|Rangoon)$/;

function myanmarCalendar(x: LumaEntry): boolean {
  return !x.calendar?.is_personal && x.calendar?.location?.country_code === "MM";
}

function inMyanmar(x: LumaEntry): boolean {
  return (
    x.event.geo_address_info?.country_code === "MM" || MYANMAR_TIMEZONE.test(x.event.timezone ?? "") || myanmarCalendar(x)
  );
}

async function calendarEvents(calendarId: string): Promise<LumaEntry[]> {
  const res = await fetch(
    `https://api.lu.ma/calendar/get-items?calendar_api_id=${encodeURIComponent(calendarId)}&period=future&pagination_limit=50`,
    { headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" }, next: { revalidate: 1800 } },
  );
  if (!res.ok) throw new Error(`Luma responded ${res.status}`);
  const data = (await res.json()) as { entries?: LumaEntry[] };
  return data.entries ?? [];
}

/** A one-word label for events that aren't hackathons, shown as a tag on the card. */
function eventKind(title: string): string {
  if (/workshop|study jam|class|training/i.test(title)) return "Workshop";
  if (/bootcamp/i.test(title)) return "Bootcamp";
  if (/competition|challenge|olympiad|pitch/i.test(title)) return "Competition";
  if (/conference|summit|devfest|festival/i.test(title)) return "Conference";
  return "Meetup";
}

export async function fetchLumaMyanmar(): Promise<RawHackathon[]> {
  const found = (await Promise.all(MYANMAR_QUERIES.map(search))).flat();
  const calendars = new Set(MYANMAR_CALENDARS);
  for (const x of found) if (myanmarCalendar(x) && x.calendar?.api_id) calendars.add(x.calendar.api_id);
  // A calendar that fails to load shouldn't hide what the searches found.
  const listed = (await Promise.allSettled([...calendars].map(calendarEvents))).flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );

  const seen = new Set<string>();
  return [...found, ...listed]
    .filter((x) => {
      if (seen.has(x.event.api_id) || !inMyanmar(x)) return false;
      seen.add(x.event.api_id);
      return true;
    })
    .map((x) => {
      const h = normalize(x);
      // Name the place on virtual events too, so they land in the Myanmar section.
      if (h.mode === "online") {
        const city = x.calendar?.location?.city;
        h.location = `Online · ${city ? `${city}, ` : ""}Myanmar`;
      } else if (!/myanmar|burma/i.test(h.location)) {
        h.location = `${h.location}, Myanmar`;
      }
      if (!HACKATHON_NAME.test(h.title)) h.themes = [eventKind(h.title)];
      return h;
    });
}
