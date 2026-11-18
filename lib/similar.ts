import type { Hackathon } from "./types";

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !/^(hack|hackathon|hacks|\d+)$/.test(w)),
  );

/** Live hackathons most like this one: shared themes, companies, format, place and name words. */
export function similarTo(h: Hackathon, list: Hackathon[], limit = 6): Hackathon[] {
  const themes = new Set(h.themes.map((t) => t.toLowerCase()));
  const companies = new Set(h.companies);
  const name = words(h.title);
  return list
    .filter((x) => x.id !== h.id)
    .map((x) => {
      let score = 0;
      for (const t of x.themes) if (themes.has(t.toLowerCase())) score += 3;
      for (const c of x.companies) if (companies.has(c)) score += 4;
      for (const w of words(x.title)) if (name.has(w)) score += 2;
      if (x.myanmar && h.myanmar) score += 4;
      if (x.mode === h.mode) score += 1;
      if (x.source === h.source) score += 0.5;
      return { x, score };
    })
    .filter((s) => s.score >= 3)
    .sort((a, b) => b.score - a.score || (a.x.deadline ?? "9").localeCompare(b.x.deadline ?? "9"))
    .slice(0, limit)
    .map((s) => s.x);
}
