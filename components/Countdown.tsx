"use client";

import { ClockIcon } from "./icons";
import { DAY, formatRemaining } from "@/lib/time";

// Short verbs for the badge; the full label goes in the tooltip.
const SHORT: Record<string, string> = {
  "Submissions close": "Closes",
  "Registration closes": "Reg. closes",
  Starts: "Starts",
};

export function Countdown({ deadline, label, now }: { deadline: string | null; label: string; now: number | null }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums";
  if (!deadline) return <span className={`${base} bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400`}>No deadline</span>;
  // Reserve the space before mount so cards don't shift when the countdown appears.
  if (now === null) return <span className={`${base} w-24 animate-pulse bg-zinc-100 dark:bg-zinc-800`}>&nbsp;</span>;

  const ms = Date.parse(deadline) - now;
  const passed = ms <= 0;
  const live = passed && label === "Starts";
  const urgent = !passed && ms < 2 * DAY;
  const tone = live
    ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900"
    : passed
      ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      : urgent
        ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900"
        : ms < 7 * DAY
          ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900"
          : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900";

  const verb = SHORT[label] ?? label;
  const text = passed ? (live ? "Happening now" : "Closed") : `${verb} in ${formatRemaining(ms)}`;

  return (
    <span className={`${base} ${tone}`} title={`${label}: ${new Date(deadline).toLocaleString()}`}>
      {/* A pulsing dot draws the eye to events closing within 48 hours or already under way. */}
      {urgent || live ? (
        <span className="relative mx-0.5 flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <ClockIcon size={12} />
      )}
      {text}
    </span>
  );
}
