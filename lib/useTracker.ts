"use client";

import { useCallback, useSyncExternalStore } from "react";
import { detectCompanies } from "./companies";
import { isMyanmar } from "./myanmar";
import { safeUrl } from "./safeUrl";
import { isSource } from "./sources/meta";
import { RESULTS, STATUSES, type Hackathon, type Mode, type TrackedItem, type TrackResult, type TrackStatus } from "./types";

/** The fields you can edit on a saved hackathon. */
export type TrackedExtras = Pick<TrackedItem, "notes" | "team" | "project" | "remindAt" | "result">;

type Tracked = Record<string, TrackedItem>;

const KEY = "hackathon-hunter:tracked";
const EVENT = "hackathon-hunter:tracked-change";
const EMPTY: Tracked = {};

let cachedRaw: string | null = null;
let cachedValue: Tracked = EMPTY;

function read(): Tracked {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  // useSyncExternalStore needs a stable reference while the stored value is unchanged.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? (JSON.parse(raw) as Tracked) : EMPTY;
    } catch {
      cachedValue = EMPTY;
    }
  }
  return cachedValue;
}

const MODES = ["online", "in-person", "hybrid"];
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : null);
const isoOrNull = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);

/**
 * An imported file is untrusted: keep only well-formed entries, rebuilt field by field,
 * and drop any whose link isn't plain http(s).
 */
function sanitizeImport(data: unknown): Tracked {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
  const out: Tracked = {};
  for (const item of Object.values(data as Record<string, unknown>)) {
    if (typeof item !== "object" || item === null) continue;
    const { status, savedAt, snapshot: s, notes, team, project, remindAt, result } = item as Record<string, unknown>;
    if (!STATUSES.includes(status as TrackStatus) || typeof s !== "object" || s === null) continue;
    const h = s as Record<string, unknown>;
    const id = str(h.id, 200);
    const title = str(h.title);
    const url = safeUrl(h.url);
    if (!id || !title || !url) continue;
    const themes = Array.isArray(h.themes) ? h.themes.filter((t) => typeof t === "string").slice(0, 20) : [];
    const sponsors = Array.isArray(h.sponsors) ? h.sponsors.filter((t) => typeof t === "string").slice(0, 40) : [];
    out[id] = {
      status: status as TrackStatus,
      savedAt: isoOrNull(savedAt) ?? new Date().toISOString(),
      ...cleanExtras({ notes, team, project, remindAt, result }),
      snapshot: {
        id,
        source: isSource(h.source) ? h.source : "manual",
        title,
        url,
        image: safeUrl(h.image),
        startDate: isoOrNull(h.startDate),
        endDate: isoOrNull(h.endDate),
        deadline: isoOrNull(h.deadline),
        deadlineLabel: str(h.deadlineLabel, 60) ?? "Deadline",
        location: str(h.location, 200) ?? "TBA",
        mode: MODES.includes(h.mode as Mode) ? (h.mode as Mode) : "online",
        prizeUsd: typeof h.prizeUsd === "number" && Number.isFinite(h.prizeUsd) ? h.prizeUsd : null,
        themes: themes as string[],
        participants: typeof h.participants === "number" && Number.isFinite(h.participants) ? h.participants : null,
        organizer: str(h.organizer),
        sponsors: sponsors as string[],
        description: str(h.description, 1000),
        companies: detectCompanies({ title, organizer: str(h.organizer), sponsors: sponsors as string[] }),
        myanmar: isMyanmar({ title, location: str(h.location, 200) ?? "" }),
      },
    };
  }
  return out;
}

/** Keeps only well-formed extras: bounded text, an http(s) project link, a real date and a known result. */
function cleanExtras(x: Record<string, unknown>): TrackedExtras {
  const out: TrackedExtras = {};
  const notes = str(x.notes, 5000)?.trim();
  const team = str(x.team, 300)?.trim();
  const project = safeUrl(x.project);
  const remindAt = isoOrNull(x.remindAt);
  if (notes) out.notes = notes;
  if (team) out.team = team;
  if (project) out.project = project;
  if (remindAt) out.remindAt = remindAt;
  if (RESULTS.includes(x.result as TrackResult)) out.result = x.result as TrackResult;
  return out;
}

/** How many entries in an exported file or sync link are valid, without importing them. */
export function countImportable(data: unknown): number {
  return Object.keys(sanitizeImport(data)).length;
}

function write(next: Tracked) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota); changes just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useTracker() {
  const tracked = useSyncExternalStore(subscribe, read, () => EMPTY);

  const save = useCallback((h: Hackathon, status: TrackStatus = "interested") => {
    const cur = read();
    // Saving again keeps your notes and links.
    write({ ...cur, [h.id]: { ...cur[h.id], status, savedAt: cur[h.id]?.savedAt ?? new Date().toISOString(), snapshot: h } });
  }, []);

  const remove = useCallback((id: string) => {
    const { [id]: _removed, ...rest } = read();
    void _removed;
    write(rest);
  }, []);

  const setStatus = useCallback((id: string, status: TrackStatus) => {
    const cur = read();
    if (cur[id]) write({ ...cur, [id]: { ...cur[id], status } });
  }, []);

  /** Replaces a saved hackathon's notes, team, project link, reminder and result. */
  const update = useCallback((id: string, extras: TrackedExtras, status?: TrackStatus) => {
    const cur = read();
    if (!cur[id]) return;
    const { notes: _n, team: _t, project: _p, remindAt: _r, result: _res, ...base } = cur[id];
    void [_n, _t, _p, _r, _res];
    write({ ...cur, [id]: { ...base, ...(status ? { status } : {}), ...cleanExtras(extras as Record<string, unknown>) } });
  }, []);

  /** Refresh stored snapshots with the latest live data so saved cards stay current. */
  const syncSnapshots = useCallback((live: Hackathon[]) => {
    const cur = read();
    let changed = false;
    const next = { ...cur };
    for (const h of live) {
      if (next[h.id] && JSON.stringify(next[h.id].snapshot) !== JSON.stringify(h)) {
        next[h.id] = { ...next[h.id], snapshot: h };
        changed = true;
      }
    }
    if (changed) write(next);
  }, []);

  const clear = useCallback(() => write({}), []);

  /** Merges an exported file. Returns how many entries were valid and imported. */
  const importData = useCallback((data: unknown) => {
    const valid = sanitizeImport(data);
    write({ ...read(), ...valid });
    return Object.keys(valid).length;
  }, []);

  return { tracked, save, remove, setStatus, update, syncSnapshots, importData, clear };
}
