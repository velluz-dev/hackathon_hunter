import type { Hackathon } from "./types";

// Pure date helpers that give the same output on the server and in the browser, because
// every format names its time zone instead of using the machine's.

/** Devpost only gives dates, no times, so its listings are shown as whole days (in UTC). */
export function isDateOnly(h: Pick<Hackathon, "source">): boolean {
  return h.source === "devpost";
}

export const YANGON = "Asia/Yangon";

export function formatInZone(iso: string, timeZone: string, dateOnly = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: dateOnly ? "UTC" : timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(dateOnly ? {} : { hour: "numeric", minute: "2-digit", hour12: true }),
  }).format(new Date(iso));
}

const compact = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

/**
 * A Google Calendar "add event" link: the whole event (start to end) or just the deadline,
 * as a 30-minute slot. Null when the dates it needs aren't known.
 */
export function googleCalendarUrl(h: Hackathon, kind: "event" | "deadline", pageUrl?: string): string | null {
  let dates: string;
  if (kind === "deadline") {
    if (!h.deadline) return null;
    const at = new Date(h.deadline);
    dates = `${compact(at)}/${compact(new Date(at.getTime() + 30 * 60_000))}`;
  } else {
    if (!h.startDate) return null;
    const start = new Date(h.startDate);
    const end = h.endDate ? new Date(h.endDate) : new Date(start.getTime() + 2 * 3600_000);
    // All-day events end on the day after their last day.
    dates = isDateOnly(h) ? `${day(start)}/${day(new Date(end.getTime() + 86_400_000))}` : `${compact(start)}/${compact(end)}`;
  }
  const qs = new URLSearchParams({
    action: "TEMPLATE",
    text: kind === "deadline" ? `${h.deadlineLabel}: ${h.title}` : h.title,
    dates,
    details: [h.url, pageUrl && pageUrl !== h.url ? `Details: ${pageUrl}` : null].filter(Boolean).join("\n"),
    location: h.mode === "online" ? "Online" : h.location,
  });
  return `https://calendar.google.com/calendar/render?${qs}`;
}

/** "3d 4h", "5h 12m" or "40m" until a moment; "passed" once it's gone. */
export function remainingText(ms: number): string {
  if (ms <= 0) return "passed";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function compactUsd(n: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;
}
