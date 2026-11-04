"use client";

import { memo } from "react";
import { byline, CalendarButton, SaveButton, Thumb } from "./cardParts";
import { Countdown } from "./Countdown";
import { CalendarIcon, PinIcon } from "./icons";
import { formatDateRange } from "@/lib/time";
import type { Hackathon } from "@/lib/types";

interface Props {
  h: Hackathon;
  saved: boolean;
  now: number | null;
  onSave: (h: Hackathon) => void;
  onRemove: (id: string) => void;
}

/** Wide horizontal card for the featured Myanmar row. */
export const FeaturedCard = memo(function FeaturedCard({ h, saved, now, onSave, onRemove }: Props) {
  return (
    <article className="group/card relative flex w-[290px] shrink-0 snap-start gap-4 rounded-2xl border border-white/[0.08] bg-ink/60 p-4 backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift sm:w-[370px]">
      <Thumb h={h} size={60} />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-xs font-medium text-zinc-400">{byline(h).name}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-white">
          <a
            href={h.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors after:absolute after:inset-0 after:rounded-2xl hover:text-accent-lo focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent"
          >
            {h.title}
          </a>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <CalendarIcon size={13} className="shrink-0 text-zinc-500" />
          {formatDateRange(h.startDate, h.endDate)}
        </p>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-zinc-400" title={h.location}>
          <PinIcon size={13} className="shrink-0 text-zinc-500" />
          <span className="truncate">{h.location}</span>
        </p>
        <div className="mt-auto flex items-center gap-1 pt-3">
          <Countdown deadline={h.deadline} label={h.deadlineLabel} now={now} />
          <span className="flex-1" />
          <CalendarButton h={h} />
          <SaveButton h={h} saved={saved} onSave={onSave} onRemove={onRemove} />
        </div>
      </div>
    </article>
  );
});
