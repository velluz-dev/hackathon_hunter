import { sourceName } from "./sources/meta";
import type { Hackathon } from "./types";

// Plain functions (not client code), so server pages and client cards can both use them.

// Sources whose organizer field is a readable list of names worth showing.
const SHOWS_ORGANIZER = new Set<Hackathon["source"]>(["devpost", "cerebralvalley", "luma", "gdg", "curated", "dorahacks"]);

export function sourceLabel(h: Pick<Hackathon, "source" | "url">): string {
  if (h.source !== "manual") return sourceName(h.source);
  if (/linkedin\.com/i.test(h.url)) return "From LinkedIn";
  if (/facebook\.com|fb\.(com|me)/i.test(h.url)) return "From Facebook";
  if (/reddit\.com/i.test(h.url)) return "From Reddit";
  return "Added by you";
}

/** The organizer, when the source gives a readable one that isn't just the source's own name. */
export function organizer(h: Hackathon): string | null {
  return h.organizer && SHOWS_ORGANIZER.has(h.source) && h.organizer !== sourceLabel(h) ? h.organizer : null;
}
