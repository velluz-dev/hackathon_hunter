"use client";

import { useState } from "react";
import { CalendarPlusIcon, StarIcon } from "./icons";
import { downloadIcs } from "@/lib/ics";
import { iconButton, iconIdle } from "@/lib/ui";
import type { Hackathon } from "@/lib/types";

export { organizer, sourceLabel } from "@/lib/labels";

/** Event image, or a gradient tile with the title's first letter when there's none (or it fails to load). */
export function Thumb({ h, compact, large }: { h: Hackathon; compact?: boolean; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = large ? "h-16 w-16 text-2xl sm:h-20 sm:w-20" : compact ? "h-10 w-10" : "h-12 w-12";
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
