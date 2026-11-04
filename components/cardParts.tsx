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

/** Who runs it, and the site it came from when that's different. */
export function byline(h: Hackathon): { name: string; via: string | null } {
  const source = sourceLabel(h);
  return h.organizer && SHOWS_ORGANIZER.has(h.source) && h.organizer !== source
    ? { name: h.organizer, via: source }
    : { name: source, via: null };
}

const FALLBACKS = [
  "from-[#7655ff] to-[#b06bff]",
  "from-[#3b82f6] to-[#7655ff]",
  "from-[#10b981] to-[#0ea5e9]",
  "from-[#f59e0b] to-[#ef4444]",
  "from-[#ec4899] to-[#7655ff]",
];

/** Event image, or a gradient tile with the title's initials when there's none (or it fails to load). */
export function Thumb({ h, size }: { h: Hackathon; size: number }) {
  const [failed, setFailed] = useState(false);
  const box = "shrink-0 rounded-xl ring-1 ring-inset ring-white/10";
  if (h.image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote thumbnails from many hosts
      <img
        src={h.image}
        alt=""
        loading="lazy"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={`${box} bg-raised object-cover`}
      />
    );
  }
  const initials = h.title
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const tone = FALLBACKS[[...h.title].reduce((n, c) => n + c.charCodeAt(0), 0) % FALLBACKS.length];
  return (
    <div
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className={`${box} flex items-center justify-center bg-gradient-to-br font-semibold text-white ${tone}`}
    >
      {initials || "#"}
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
      className={`${iconButton} ${saved ? "text-amber-400 hover:bg-amber-400/10 hover:text-amber-300" : iconIdle}`}
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
      className={`${iconButton} ${iconIdle}`}
    >
      <CalendarPlusIcon size={16} />
    </button>
  );
}
