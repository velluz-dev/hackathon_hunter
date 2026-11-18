"use client";

import { useEffect, useState } from "react";

// Remembers when this browser first saw each listing, so new ones can be badged. Nothing is
// marked new on the very first visit, or everything would be.
const KEY = "hackathon-hunter:seen";
const NEW_FOR = 2 * 24 * 3600_000; // badged for two days after it first shows up
const FORGET_AFTER = 60 * 24 * 3600_000; // drop listings gone this long, to keep storage small
const EMPTY: ReadonlySet<string> = new Set();

interface Store {
  since: number;
  ids: Record<string, number>; // first seen (ms); 0 = already listed on your first visit
}

function load(): Store | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Store | null;
    return s && typeof s === "object" && typeof s.ids === "object" && s.ids !== null ? s : null;
  } catch {
    return null;
  }
}

/** Ids of the listings this browser first saw within the last two days. Empty until mounted. */
export function useFreshIds(ids: string[]): ReadonlySet<string> {
  const [fresh, setFresh] = useState<ReadonlySet<string>>(EMPTY);
  useEffect(() => {
    const now = Date.now();
    const stored = load();
    const seen: Record<string, number> = stored ? { ...stored.ids } : {};
    for (const id of ids) if (!(id in seen)) seen[id] = stored ? now : 0;
    const current = new Set(ids);
    for (const [id, t] of Object.entries(seen)) if (!current.has(id) && now - t > FORGET_AFTER) delete seen[id];
    try {
      localStorage.setItem(KEY, JSON.stringify({ since: stored?.since ?? now, ids: seen } satisfies Store));
    } catch {
      // Storage full or blocked: badges just won't persist.
    }
    setFresh(new Set(ids.filter((id) => seen[id] > 0 && now - seen[id] < NEW_FOR)));
  }, [ids]);
  return fresh;
}
