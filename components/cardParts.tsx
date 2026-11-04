"use client";

import { useState } from "react";
import { CalendarPlusIcon, StarIcon } from "./icons";
import { downloadIcs } from "@/lib/ics";
import { iconButton, iconIdle } from "@/lib/ui";
import type { Hackathon } from "@/lib/types";

const SOURCE_NAMES: Partial<Record<Hackathon["source"], string>> = {
  devpost: "Devpost",
  mlh: "MLH",
  cerebralvalley: "Cerebral Valley",
  lablab: "lablab.ai",
  luma: "Luma",
  spaceapps: "NASA Space Apps",
  curated: "Local pick",
};

// Sources whose organizer field is a readable list of names worth showing.
const SHOWS_ORGANIZER = new Set<Hackathon["source"]>(["devpost", "cerebralvalley", "luma", "curated"]);

export function sourceLabel(h: Hackathon): string {
  const named = SOURCE_NAMES[h.source];
  if (named) return named;
  if (/linkedin\.com/i.test(h.url)) return "From LinkedIn";
  if (/facebook\.com|fb\.(com|me)/i.test(h.url)) return "From Facebook";
  if (/reddit\.com/i.test(h.url)) return "From Reddit";
  return "Added by you";
}

/** The organizer, when the source gives a readable one that isn't just the source's own name. */
export function organizer(h: Hackathon): string | null {
  return h.organizer && SHOWS_ORGANIZER.has(h.source) && h.organizer !== sourceLabel(h) ? h.organizer : null;
}

/** Event image, or a gradient tile with the title's first letter when there's none (or it fails to load). */
export function Thumb({ h, compact }: { h: Hackathon; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = compact ? "h-10 w-10" : "h-12 w-12";
  if (h.image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote thumbnails from many hosts
      <img
        src={h.image}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${size} shrink-0 rounded-xl bg-zinc-100 object-cover ring-1 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/10`}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white`}
    >
      {h.title[0]?.toUpperCase()}
    </div>
  );
}

export function SaveButton({
  h,
  saved,
  onSave,
  onRemove,
}: {
  h: Hackathon;
  saved: boolean;
  onSave: (h: Hackathon) => void;
  onRemove: (id: string) => void;
}) {
  const [pop, setPop] = useState(false);
  return (
    <button
      onClick={() => {
        if (saved) return onRemove(h.id);
        onSave(h);
        setPop(true);
      }}
      aria-label={saved ? `Remove ${h.title} from saved` : `Save ${h.title}`}
      aria-pressed={saved}
      title={saved ? "Remove from saved" : "Save"}
      className={`${iconButton} ${
        saved
          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50"
          : "text-zinc-300 hover:bg-zinc-100 hover:text-amber-500 dark:text-zinc-600 dark:hover:bg-zinc-800"
      }`}
    >
      <StarIcon size={18} filled={saved} className={pop ? "animate-pop" : ""} onAnimationEnd={() => setPop(false)} />
    </button>
  );
}

export function CalendarButton({ h }: { h: Hackathon }) {
  if (!h.deadline) return null;
  return (
    <button
      onClick={() => downloadIcs(h)}
      title="Add deadline to calendar"
      aria-label={`Add ${h.title} deadline to calendar`}
      className={`${iconButton} h-7 w-7 rounded-md ${iconIdle}`}
    >
      <CalendarPlusIcon size={15} />
    </button>
  );
}
