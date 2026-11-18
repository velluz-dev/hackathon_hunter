import type { Hackathon } from "./types";

/**
 * The hackathon's page on this site, e.g. /h/devpost/12345. Null for hackathons added from a
 * link: those live only in your browser, so there's no page for the server to render.
 */
export function hackathonPath(h: Pick<Hackathon, "id" | "source">): string | null {
  const prefix = `${h.source}:`;
  if (h.source === "manual" || !h.id.startsWith(prefix)) return null;
  return `/h/${h.source}/${encodeURIComponent(h.id.slice(prefix.length))}`;
}

/** The listing id for a /h/<source>/<id> page, e.g. "devpost:12345". */
export function idFromParams(source: string, id: string): string {
  let raw = id;
  try {
    raw = decodeURIComponent(id);
  } catch {
    // Not valid percent-encoding: use the segment as it is.
  }
  return `${source}:${raw}`;
}

/** This site's public origin, for absolute links in feeds, share text and the Telegram bot. */
export function siteUrl(): string {
  const configured = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.trim();
  if (configured) return (/^https?:\/\//i.test(configured) ? configured : `https://${configured}`).replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
