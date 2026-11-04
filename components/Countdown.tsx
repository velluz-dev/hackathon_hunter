"use client";

import { ClockIcon } from "./icons";
import { DAY, formatRemaining } from "@/lib/time";

// Short verbs for the badge; the full label goes in the tooltip.
const SHORT: Record<string, string> = {
  "Submissions close": "Closes",
  "Registration closes": "Reg. closes",
  Starts: "Starts",
};

const MUTED = "bg-white/[0.05] text-zinc-400 ring-white/[0.06]";

export function Countdown({ deadline, label, now }: { deadline: string | null; label: string; now: number | null }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset";
  if (!deadline) return <span className={`${base} ${MUTED}`}>No deadline yet</span>;
  // Reserve the space before mount so cards don't shift when the countdown appears.
  if (now === null) return <span className={`${base} ${MUTED} w-24 animate-pulse`}>&nbsp;</span>;

  const ms = Date.parse(deadline) - now;
  const passed = ms <= 0;
  const live = passed && label === "Starts";
  const urgent = !passed && ms < 2 * DAY;
  const tone = live
    ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
    : passed
      ? MUTED
      : urgent
        ? "bg-red-500/10 text-red-300 ring-red-500/30"
        : ms < 7 * DAY
          ? "bg-amber-400/10 text-amber-300 ring-amber-400/25"
          : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";

  const verb = SHORT[label] ?? label;
  const text = passed ? (live ? "Happening now" : "Closed") : `${verb} in ${formatRemaining(ms)}`;

  return (
    <span className={`${base} ${tone}`} title={`${label}: ${new Date(deadline).toLocaleString()}`}>
      {urgent || live ? (
        <span className="relative flex h-1.5 w-1.5">
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
