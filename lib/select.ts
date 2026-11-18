import { applyFilters, DEFAULT_FILTERS, filtersFromParams, type FilterState } from "./filters";
import { sourceName } from "./sources/meta";
import type { Hackathon } from "./types";

const MAX_IDS = 500;

/** Words describing a filtered view, e.g. "Myanmar · Big tech · “ai”", for feed titles. */
export function describeFilters(f: FilterState): string {
  const parts = [
    f.myanmar && "Myanmar",
    f.mode !== "all" && { online: "Online", "in-person": "In person", hybrid: "Hybrid" }[f.mode],
    f.bigTech && "Big tech",
    f.companies.length > 0 && f.companies.join(", "),
    f.closingSoon && "Closing this week",
    f.source !== "all" && sourceName(f.source),
    f.minPrize > 0 && `$${f.minPrize.toLocaleString("en-US")}+ prizes`,
    f.beginner && "Beginner friendly",
    f.loc && f.loc,
    f.themes.length > 0 && f.themes.join(", "),
    f.q && `“${f.q}”`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All hackathons";
}

/**
 * The hackathons a feed or API call asks for: `ids=a,b,c` for a saved list, otherwise the same
 * filter parameters as the Browse page's URL (mm=1, mode=online, bigtech=1, q=…).
 */
export function selectHackathons(all: Hackathon[], params: URLSearchParams, now = Date.now()): { list: Hackathon[]; label: string } {
  const ids = params.get("ids");
  if (ids !== null) {
    const wanted = new Set(ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_IDS));
    return { list: all.filter((h) => wanted.has(h.id)), label: "Saved hackathons" };
  }
  const f = filtersFromParams(params);
  return { list: applyFilters(all, f, now), label: describeFilters(f) };
}

export const hasFilters = (params: URLSearchParams) =>
  params.has("ids") || JSON.stringify(filtersFromParams(params)) !== JSON.stringify(DEFAULT_FILTERS);
