import type { Mode } from "./types";

// Reads a hackathon announcement written for people (a Facebook post, a Telegram message)
// and pulls out what a listing needs: a name, the deadline, the event dates, the place, the
// format and a USD prize. Myanmar posts mix English and Burmese, so Burmese digits and month
// names are understood too. Times without a zone are taken as Myanmar time (UTC+6:30).

export interface ParsedPost {
  title: string | null;
  url: string | null;
  deadline: string | null; // ISO
  deadlineLabel: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  mode: Mode | null;
  prizeUsd: number | null;
  /** Reads like a hackathon, competition or similar call for participants. */
  isHackathon: boolean;
}

const MMT_OFFSET = 6.5 * 3600_000;
const DAY = 86_400_000;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";

const BURMESE_MONTHS: [RegExp, string][] = [
  [/ဇန်နဝါရီ(လ)?/g, " January "],
  [/ဖေဖော်ဝါရီ(လ)?/g, " February "],
  [/မတ်(လ)?/g, " March "],
  [/ဧပြီ(လ)?/g, " April "],
  [/မေလ/g, " May "],
  [/ဇွန်(လ)?/g, " June "],
  [/ဇူလိုင်(လ)?/g, " July "],
  [/(ဩ|သြ)ဂုတ်(လ)?/g, " August "],
  [/စက်တင်ဘာ(လ)?/g, " September "],
  [/အောက်တိုဘာ(လ)?/g, " October "],
  [/နိုဝင်ဘာ(လ)?/g, " November "],
  [/ဒီဇင်ဘာ(လ)?/g, " December "],
];

export const HACKATHON_WORDS =
  /hack(athon|athons|fest|ers?)?\b|ideathon|buildathon|datathon|designathon|codefest|code ?jam|game ?jam|competition|challenge|olympiad|startup weekend|pitch(ing)? (competition|contest|night)|ဟက်ကသွန်|ဟက်ကာသွန်|ဟက်သွန်|ပြိုင်ပွဲ/i;

const CITIES: [RegExp, string][] = [
  [/\b(yangon|rangoon)\b|ရန်ကုန်/i, "Yangon"],
  [/\bmandalay\b|မန္တလေး/i, "Mandalay"],
  [/\bnay ?pyi ?taw\b|\bnaypyidaw\b|နေပြည်တော်/i, "Nay Pyi Taw"],
  [/\btaunggyi\b|တောင်ကြီး/i, "Taunggyi"],
  [/\bmawlamyine\b|မော်လမြိုင်/i, "Mawlamyine"],
  [/\bbago\b|ပဲခူး/i, "Bago"],
  [/\bpathein\b|ပုသိမ်/i, "Pathein"],
  [/\bmonywa\b|မုံရွာ/i, "Monywa"],
  [/\bmyitkyina\b|မြစ်ကြီးနား/i, "Myitkyina"],
  [/\bmagway\b|မကွေး/i, "Magway"],
  [/\bpyay\b|ပြည်မြို့/i, "Pyay"],
  [/\bmeiktila\b|မိတ္ထီလာ/i, "Meiktila"],
  [/\bsittwe\b|စစ်တွေ/i, "Sittwe"],
  [/\bhpa-?an\b|ဘားအံ/i, "Hpa-An"],
  [/\bdawei\b|ထားဝယ်/i, "Dawei"],
];

// The event itself is online ("online hackathon", "held online", "Format: online"), not just an online info session.
const ONLINE =
  /\b(online|virtual|remote)\s+(hackathon|ideathon|event|competition|challenge|edition|format)|\b(held|hosted|happening|run|join(\s+us)?|compete|participate)\s+(online|virtually|remotely)|\b(fully|100%|entirely)\s+(online|virtual|remote)|\b(mode|format|type)\s*[:：-]\s*(online|virtual|remote)|\bvia\s+(zoom|google meet|ms teams|microsoft teams)|အွန်လိုင်း(မှ|ဖြင့်|ကနေ|ပေါ်တွင်)/i;
const HYBRID = /\bhybrid\b|online\s*(\+|&|and|or)\s*(on[- ]?site|offline|in[- ]person)/i;
const IN_PERSON = /\b(venue|in[- ]person|on[- ]?site|offline|campus|auditorium)\b|နေရာ\s*[:：-]/i;
// Words before a date that make it a deadline ("Apply by Nov 25"), and Burmese ones that follow it.
const DEADLINE_BEFORE =
  /(deadline|due|apply\s+(by|before|until)|register\s+(by|before|until)|registrations?\s*(closes?|deadline|ends?|until|due|by)?|applications?\s*(closes?|due|deadline|until|by|open\s+until)?|submi(t|ssions?)\s*(by|before|deadline|due|until|close)?|last\s+(day|date)|closes?\s*(on)?|until|before|till|နောက်ဆုံး|လျှောက်ထားရန်|လျှောက်ထား|စာရင်းသွင်း(ရန်)?|စာရင်းပေးသွင်း(ရန်)?)[^.\n\d]{0,25}$/i;
const DEADLINE_AFTER = /^[^.\n]{0,20}(နောက်ဆုံး|အထိ|နောက်ဆုံးထား)/;
const EVENT_BEFORE = /(event\s+date|hackathon\s+(date|day)s?|held\s+(on|from)|takes?\s+place|date|when|from|on|ကျင်းပ|ပြုလုပ်)[^.\n\d]{0,20}$/i;

interface Ymd {
  y: number | null;
  m: number; // 0-11
  d: number;
}
interface Found {
  index: number;
  length: number;
  start: Ymd;
  end: Ymd | null;
  time: { h: number; min: number } | null;
}

/** Burmese digits and month names become their English forms; dashes and ordinals are simplified. */
export function normalizeText(text: string): string {
  let s = text.replace(/[၀-၉]/g, (c) => String(c.charCodeAt(0) - 0x1040));
  for (const [re, en] of BURMESE_MONTHS) s = s.replace(re, en);
  return s
    .replace(/ခုနှစ်|ရက်နေ့|ရက်|နေ့/g, " ")
    .replace(/[–—~]|\bto\b|\bthru\b|\bthrough\b/gi, "-")
    .replace(/(\d{1,2})(st|nd|rd|th)\b/gi, "$1")
    .replace(/[ \t ]+/g, " ");
}

const month = (s: string) => MONTHS.indexOf(s.toLowerCase().slice(0, 3));
const year = (s?: string) => (s ? Number(s) : null);

/** Every date or date range in the text, longest matches first, without overlaps. */
function findDates(s: string): Found[] {
  const patterns: [RegExp, (m: RegExpMatchArray) => Pick<Found, "start" | "end"> | null][] = [
    // Dec 30 - Jan 2, 2027 / Nov 28, 2026 - Dec 1, 2026
    [new RegExp(`${MONTH}\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?\\s*-\\s*${MONTH}\\s+(\\d{1,2}),?\\s*(\\d{4})?`, "gi"),
      (m) => ({ start: { y: year(m[3]), m: month(m[1]), d: +m[2] }, end: { y: year(m[6]), m: month(m[4]), d: +m[5] } })],
    // 30 Dec - 2 Jan 2027
    [new RegExp(`(\\d{1,2})\\s+${MONTH}(?:\\s+(\\d{4}))?\\s*-\\s*(\\d{1,2})\\s+${MONTH},?\\s*(\\d{4})?`, "gi"),
      (m) => ({ start: { y: year(m[3]), m: month(m[2]), d: +m[1] }, end: { y: year(m[6]), m: month(m[5]), d: +m[4] } })],
    // Dec 5-7, 2026
    [new RegExp(`${MONTH}\\s+(\\d{1,2})\\s*-\\s*(\\d{1,2}),?\\s*(\\d{4})?`, "gi"),
      (m) => ({ start: { y: year(m[4]), m: month(m[1]), d: +m[2] }, end: { y: year(m[4]), m: month(m[1]), d: +m[3] } })],
    // 5-7 December 2026
    [new RegExp(`(\\d{1,2})\\s*-\\s*(\\d{1,2})\\s+${MONTH},?\\s*(\\d{4})?`, "gi"),
      (m) => ({ start: { y: year(m[4]), m: month(m[3]), d: +m[1] }, end: { y: year(m[4]), m: month(m[3]), d: +m[2] } })],
    // 2026 December 5 (how Burmese writes it)
    [new RegExp(`(\\d{4})\\s+${MONTH}\\s+(\\d{1,2})\\b`, "gi"), (m) => ({ start: { y: +m[1], m: month(m[2]), d: +m[3] }, end: null })],
    // December 5, 2026 / Dec 5
    [new RegExp(`${MONTH}\\s+(\\d{1,2})\\b(?:,?\\s*(\\d{4}))?`, "gi"), (m) => ({ start: { y: year(m[3]), m: month(m[1]), d: +m[2] }, end: null })],
    // 5 December 2026 / 5 Dec
    [new RegExp(`\\b(\\d{1,2})\\s+${MONTH}(?:,?\\s*(\\d{4}))?`, "gi"), (m) => ({ start: { y: year(m[3]), m: month(m[2]), d: +m[1] }, end: null })],
    // 2026-12-05
    [/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (m) => ({ start: { y: +m[1], m: +m[2] - 1, d: +m[3] }, end: null })],
    // 5/12/2026 or 5.12.2026: day first, as Myanmar writes it (unless the first number can't be a day... or a month)
    [/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/g, (m) => {
      const [a, b] = [+m[1], +m[2]];
      const [d, mo] = b > 12 ? [b, a] : [a, b];
      return mo >= 1 && mo <= 12 ? { start: { y: +m[3], m: mo - 1, d }, end: null } : null;
    }],
  ];
  const found: Found[] = [];
  for (const [re, build] of patterns) {
    for (const m of s.matchAll(re)) {
      const at = m.index ?? 0;
      if (found.some((f) => at < f.index + f.length && f.index < at + m[0].length)) continue;
      const parts = build(m);
      if (!parts || parts.start.m < 0 || parts.start.d < 1 || parts.start.d > 31 || (parts.end && (parts.end.m < 0 || parts.end.d < 1 || parts.end.d > 31))) continue;
      const after = s.slice(at + m[0].length, at + m[0].length + 24);
      const t = after.match(/^\s*(?:,|at|@|from)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
      let time: Found["time"] = null;
      if (t && (t[2] || t[3])) {
        let h = +t[1] % 12;
        if (!t[3]) h = +t[1];
        else if (/pm/i.test(t[3])) h += 12;
        if (h < 24) time = { h, min: t[2] ? +t[2] : 0 };
      }
      found.push({ index: at, length: m[0].length, ...parts, time });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

/** Myanmar wall-clock time to an ISO instant. Missing years become the next time that date comes round. */
function toIso(ymd: Ymd, h: number, min: number, ref: number): string {
  const at = (y: number) => Date.UTC(y, ymd.m, ymd.d, h, min) - MMT_OFFSET;
  let y = ymd.y ?? new Date(ref + MMT_OFFSET).getUTCFullYear();
  if (ymd.y === null && at(y) < ref - 60 * DAY) y += 1;
  return new Date(at(y)).toISOString();
}

function cleanLine(line: string): string {
  return line
    .replace(/^[^\p{L}\p{N}]+/u, "") // leading emoji, bullets and #
    .replace(/(\s#[\p{L}\p{N}_]+)+\s*$/u, "") // trailing hashtags
    .replace(/[\s\p{Extended_Pictographic}️]+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTitle(text: string): string | null {
  const lines = text.split(/\n+/).map(cleanLine).filter((l) => l.length >= 4 && !/^https?:\/\//i.test(l));
  const generic = /^(announcement|update|reminder|registration|register now|apply now|calling all|good news|attention)[\s!.:]*$/i;
  const line = lines.slice(0, 5).find((l) => HACKATHON_WORDS.test(l) && !generic.test(l)) ?? lines.find((l) => !generic.test(l));
  if (!line) return null;
  if (line.length <= 100) return line;
  const cut = line.slice(0, 100);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60)).trim()}…`;
}

function pickPlace(text: string): { location: string | null; mode: Mode | null } {
  const online = ONLINE.test(text);
  let venue = text.match(/(?:venue|location|place|နေရာ)\s*[:：-]\s*([^\n]{3,90})/i)?.[1]?.trim().replace(/[.,;]+$/, "");
  if (venue && /^(online|virtual|zoom)/i.test(venue)) venue = undefined;
  // The venue line's city wins; otherwise the city the post names first (usually in its title).
  const firstCity = CITIES.map(([re, name]) => ({ name, at: text.search(re) }))
    .filter((c) => c.at >= 0)
    .sort((a, b) => a.at - b.at)[0]?.name;
  const city = CITIES.find(([re]) => venue && re.test(venue))?.[1] ?? firstCity ?? null;
  const inPerson = !!venue || IN_PERSON.test(text) || (!!city && !online);
  const mode: Mode | null = HYBRID.test(text) || (online && inPerson) ? "hybrid" : online ? "online" : inPerson ? "in-person" : null;
  // A venue that is only the city's name (often in Burmese) reads better as the English name.
  const venueIsCity = venue && city && CITIES.some(([re, name]) => name === city && re.test(venue!)) && venue.length <= 24;
  const place = venue && !venueIsCity ? (city && !venue.toLowerCase().includes(city.toLowerCase()) ? `${venue}, ${city}` : venue) : city;
  if (mode === "online") return { location: city ? `Online · ${city}, Myanmar` : "Online", mode };
  return { location: place ? (/myanmar|burma/i.test(place) ? place : `${place}, Myanmar`) : null, mode };
}

function pickPrize(text: string): number | null {
  const amounts: number[] = [];
  for (const m of text.matchAll(/(?:US)?\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k|m|million)?\b|(\d[\d,]*(?:\.\d+)?)\s*(k)?\s*(?:usd|us dollars?)\b/gi)) {
    const n = Number((m[1] ?? m[3]).replace(/,/g, ""));
    const scale = { k: 1e3, m: 1e6, million: 1e6 }[(m[2] ?? m[4] ?? "").toLowerCase()] ?? 1;
    if (Number.isFinite(n) && n > 0) amounts.push(n * scale);
  }
  return amounts.length ? Math.max(...amounts) : null;
}

/** Reads a post's text. `ref` is when it was posted (for dates written without a year). */
export function parsePost(text: string, ref = Date.now()): ParsedPost {
  const s = normalizeText(text);
  const dates = findDates(s);
  const deadlineHit = dates.find((f) => DEADLINE_BEFORE.test(s.slice(Math.max(0, f.index - 60), f.index)) || DEADLINE_AFTER.test(s.slice(f.index + f.length)));
  const rest = dates.filter((f) => f !== deadlineHit);
  const event =
    rest.find((f) => f.end) ??
    rest.find((f) => EVENT_BEFORE.test(s.slice(Math.max(0, f.index - 40), f.index))) ??
    rest.find((f) => !deadlineHit || toIso(f.start, 9, 0, ref) > toIso(deadlineHit.end ?? deadlineHit.start, 0, 0, ref)) ??
    null;

  const deadlineDay = deadlineHit ? (deadlineHit.end ?? deadlineHit.start) : null;
  const dt = deadlineHit?.time;
  // A deadline day without a time means the end of that day, Myanmar time.
  const deadline = deadlineDay ? toIso(deadlineDay, dt ? dt.h : 23, dt ? dt.min : 59, ref) : null;
  const startDate = event ? toIso(event.start, event.time?.h ?? 9, event.time?.min ?? 0, ref) : null;
  let endDate = event ? toIso(event.end ?? event.start, event.end ? 18 : Math.min(23, (event.time?.h ?? 9) + 9), 0, ref) : null;
  // "Dec 30 - Jan 2" without a year: the end is in the next year.
  if (startDate && endDate && endDate < startDate) endDate = new Date(Date.parse(endDate) + 365 * DAY).toISOString();
  const label = /appl(y|ication)|လျှောက်/i.test(s.slice(Math.max(0, (deadlineHit?.index ?? 0) - 60), deadlineHit?.index ?? 0))
    ? "Applications close"
    : /submi/i.test(s.slice(Math.max(0, (deadlineHit?.index ?? 0) - 60), deadlineHit?.index ?? 0))
      ? "Submissions close"
      : "Registration closes";

  const { location, mode } = pickPlace(s);
  return {
    title: pickTitle(text),
    url: text.match(/https?:\/\/[^\s<>"')\]]+/)?.[0] ?? null,
    deadline: deadline ?? startDate,
    deadlineLabel: deadline ? label : "Starts",
    startDate,
    endDate,
    location,
    mode,
    prizeUsd: pickPrize(s),
    isHackathon: HACKATHON_WORDS.test(s),
  };
}

/** HTML from a feed item as plain text, keeping line breaks so titles and "Venue:" lines survive. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
