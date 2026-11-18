import { hackathonPath } from "./paths";
import { safeUrl } from "./safeUrl";
import { sourceName } from "./sources/meta";
import type { Hackathon } from "./types";
import { compactUsd, formatInZone, isDateOnly, YANGON } from "./when";

// Calendar (.ics) and RSS feeds for any filtered view. Calendar apps and feed readers
// re-download these on their own schedule, so a subscription stays up to date.

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dayStamp = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n|\r/g, "\\n");

/** RFC 5545 lines are at most 75 octets; longer ones continue on the next line after a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let chunk = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(chunk);
      chunk = "";
      size = 0;
    }
    chunk += ch;
    size += n;
  }
  out.push(chunk);
  return out.join("\r\n ");
}

export function pageUrl(h: Hackathon, base: string): string {
  const path = hackathonPath(h);
  return path ? `${base}${path}` : h.url;
}

function summary(h: Hackathon): string {
  return [
    `${sourceName(h.source)}${h.organizer ? ` · ${h.organizer}` : ""}`,
    h.deadline ? `${h.deadlineLabel}: ${formatInZone(h.deadline, YANGON, isDateOnly(h))}${isDateOnly(h) ? "" : " (Yangon time)"}` : null,
    `Where: ${h.mode === "hybrid" ? `Hybrid · ${h.location}` : h.location}`,
    h.prizeUsd ? `Prizes: ${compactUsd(h.prizeUsd)}` : null,
    h.themes.length ? `Themes: ${h.themes.slice(0, 6).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function vevent(lines: string[]): string[] {
  return ["BEGIN:VEVENT", ...lines, "END:VEVENT"];
}

function alarm(trigger: string, text: string): string[] {
  return ["BEGIN:VALARM", `TRIGGER:${trigger}`, "ACTION:DISPLAY", `DESCRIPTION:${esc(text)}`, "END:VALARM"];
}

/**
 * One calendar with each hackathon's dates as an event, plus its deadline as a separate
 * 30-minute event with reminders a day and two hours before (when the deadline isn't simply
 * the start).
 */
export function buildCalendar(name: string, hackathons: Hackathon[], base: string): string {
  const now = stamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hackathon Hunter//Feeds//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
    "X-WR-CALDESC:Hackathons from Hackathon Hunter",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];
  for (const h of hackathons) {
    const link = pageUrl(h, base);
    const url = (safeUrl(link) ?? "").replace(/[\r\n]/g, "");
    const description = esc(`${summary(h)}\n\n${link}${link !== h.url ? `\n${h.url}` : ""}`);
    const location = esc(h.mode === "online" ? "Online" : h.location);
    const deadlineIsStart = h.deadline && h.startDate && h.deadline === h.startDate;

    if (h.startDate) {
      const start = new Date(h.startDate);
      const end = h.endDate ? new Date(h.endDate) : new Date(start.getTime() + 2 * 3600_000);
      const allDay = isDateOnly(h);
      lines.push(
        ...vevent([
          `UID:${esc(h.id)}@hackathon-hunter`,
          `DTSTAMP:${now}`,
          allDay ? `DTSTART;VALUE=DATE:${dayStamp(start)}` : `DTSTART:${stamp(start)}`,
          allDay ? `DTEND;VALUE=DATE:${dayStamp(new Date(end.getTime() + 86_400_000))}` : `DTEND:${stamp(end)}`,
          `SUMMARY:${esc(h.title)}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${location}`,
          ...(url ? [`URL:${url}`] : []),
          "TRANSP:TRANSPARENT",
          ...(deadlineIsStart ? alarm("-P1D", `${h.title} starts tomorrow`) : []),
        ]),
      );
    }
    if (h.deadline && !deadlineIsStart) {
      const at = new Date(h.deadline);
      lines.push(
        ...vevent([
          `UID:${esc(h.id)}-deadline@hackathon-hunter`,
          `DTSTAMP:${now}`,
          `DTSTART:${stamp(at)}`,
          `DTEND:${stamp(new Date(at.getTime() + 30 * 60_000))}`,
          `SUMMARY:${esc(`⏰ ${h.deadlineLabel}: ${h.title}`)}`,
          `DESCRIPTION:${description}`,
          ...(url ? [`URL:${url}`] : []),
          ...alarm("-P1D", `${h.title}: ${h.deadlineLabel.toLowerCase()} tomorrow`),
          ...alarm("-PT2H", `${h.title}: ${h.deadlineLabel.toLowerCase()} in 2 hours`),
        ]),
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}

const xml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!).replace(
    // Characters XML 1.0 doesn't allow at all.
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
    "",
  );

/** An RSS 2.0 feed: one item per hackathon, linking to its page here. */
export function buildRss(title: string, selfUrl: string, hackathons: Hackathon[], base: string): string {
  const items = hackathons.map((h) => {
    const link = pageUrl(h, base);
    const body = [h.description ?? "", summary(h).replace(/\n/g, " · ")].filter(Boolean).join("\n\n");
    return [
      "<item>",
      `<title>${xml(h.title)}</title>`,
      `<link>${xml(link)}</link>`,
      `<guid isPermaLink="false">${xml(h.id)}</guid>`,
      `<description>${xml(body)}</description>`,
      `<category>${xml(sourceName(h.source))}</category>`,
      ...h.themes.slice(0, 5).map((t) => `<category>${xml(t)}</category>`),
      "</item>",
    ].join("");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${xml(title)}</title>`,
    `<link>${xml(base)}</link>`,
    `<atom:link href="${xml(selfUrl)}" rel="self" type="application/rss+xml"/>`,
    "<description>Upcoming hackathons from Hackathon Hunter</description>",
    "<language>en</language>",
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    "<ttl>360</ttl>",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");
}
