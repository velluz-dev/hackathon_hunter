import type { Source } from "../types";

/** Display name and a one-line description for every source, in the order the UI lists them. */
export const SOURCE_INFO: Record<Source, { name: string; about: string }> = {
  devpost: { name: "Devpost", about: "Open hackathons with prizes and registration counts" },
  mlh: { name: "MLH", about: "Major League Hacking's season events" },
  cerebralvalley: { name: "Cerebral Valley", about: "AI hackathons, often sponsored by big tech" },
  lablab: { name: "lablab.ai", about: "Sponsor-run AI hackathons" },
  devfolio: { name: "Devfolio", about: "Hackathons across India and Asia, with application deadlines and sponsors" },
  dorahacks: { name: "DoraHacks", about: "Web3, AI and frontier-tech hackathons with prize pools" },
  hackclub: { name: "Hack Club", about: "High school hackathons around the world" },
  facebook: { name: "Facebook", about: "Hackathon posts from the Facebook pages you follow, read through feed links (rss.app, FetchRSS)" },
  luma: { name: "Luma", about: "Public hackathon events, plus every Myanmar event (Cursor, Grok and other community meetups)" },
  spaceapps: { name: "NASA Space Apps", about: "Each challenge plus its local events in Myanmar" },
  gdg: { name: "Google Developer Groups", about: "DevFest, I/O Extended and other GDG events in Myanmar" },
  curated: { name: "Local pick", about: "Hand-picked Myanmar events that no site lists" },
  manual: { name: "Added by you", about: "Hackathons you saved from a link" },
};

export const ALL_SOURCES = Object.keys(SOURCE_INFO) as Source[];
/** Sources the scrapers fill (everything except hackathons added by hand). */
export const LISTED_SOURCES = ALL_SOURCES.filter((s) => s !== "manual");

export function isSource(s: unknown): s is Source {
  return typeof s === "string" && s in SOURCE_INFO;
}

export const sourceName = (s: string): string => (isSource(s) ? SOURCE_INFO[s].name : s);
