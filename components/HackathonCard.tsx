"use client";

import { memo } from "react";
import Link from "next/link";
import { byline, CalendarButton, SaveButton, Thumb } from "./cardParts";
import { Countdown } from "./Countdown";
import { BuildingIcon, CalendarIcon, ChatIcon, GlobeIcon, PinIcon, TrophyIcon, UsersIcon } from "./icons";
import { formatDateRange } from "@/lib/time";
import { STATUSES, type Hackathon, type TrackedItem, type TrackStatus } from "@/lib/types";

const MODE_LABEL: Record<Hackathon["mode"], string> = { online: "Online", "in-person": "In person", hybrid: "Hybrid" };

function formatPrize(n: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;
}

const MAX_THEMES = 3;

interface Props {
  h: Hackathon;
  tracked?: TrackedItem;
  now: number | null;
  postCount?: number;
  /** Tighter layout for narrow board columns: no themes or registrations. */
  compact?: boolean;
  onSave: (h: Hackathon) => void;
  onRemove: (id: string) => void;
  onStatus: (id: string, s: TrackStatus) => void;
}

export const HackathonCard = memo(function HackathonCard({ h, tracked, now, postCount, compact, onSave, onRemove, onStatus }: Props) {
  const location = h.mode === "hybrid" ? `Hybrid · ${h.location}` : h.location;
  const extraThemes = h.themes.length - MAX_THEMES;
  const companies = h.companies ?? []; // snapshots saved before company tagging have none
  const { name, via } = byline(h);
  const pad = compact ? "px-3.5" : "px-4";

  return (
    <article className="group/card relative flex h-full min-w-0 flex-col rounded-2xl border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-lift">
      <div className={`flex items-start gap-3 ${pad} ${compact ? "pt-3.5" : "pt-4"}`}>
        <Thumb h={h} size={compact ? 38 : 44} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-[13px] font-medium text-zinc-300" title={name}>
            {name}
          </p>
          <p className="truncate text-xs text-zinc-500">{via ? `via ${via}` : MODE_LABEL[h.mode]}</p>
        </div>
        <div className="-mr-1.5 -mt-1">
          <SaveButton h={h} saved={!!tracked} onSave={onSave} onRemove={onRemove} />
        </div>
      </div>

      <h3 className={`mt-3 line-clamp-2 font-semibold leading-snug text-zinc-50 ${pad} ${compact ? "text-sm" : "text-[15px]"}`}>
        {/* The link covers the whole card; buttons and the status menu sit above it. */}
        <a
          href={h.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors after:absolute after:inset-0 after:rounded-2xl hover:text-accent-lo focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent"
        >
          {h.title}
        </a>
      </h3>

      <div className={`mt-2.5 space-y-1.5 text-[13px] text-zinc-400 ${pad}`}>
        <p className="flex items-center gap-2">
          <CalendarIcon size={14} className="shrink-0 text-zinc-500" />
          {formatDateRange(h.startDate, h.endDate)}
        </p>
        <p className="flex min-w-0 items-center gap-2" title={location}>
          {h.mode === "online" ? (
            <GlobeIcon size={14} className="shrink-0 text-zinc-500" />
          ) : (
            <PinIcon size={14} className="shrink-0 text-zinc-500" />
          )}
          <span className="truncate">{location}</span>
        </p>
      </div>

      <div className={`mt-3 flex flex-wrap items-center gap-1.5 ${pad}`}>
        <Countdown deadline={h.deadline} label={h.deadlineLabel} now={now} />
        {companies.slice(0, 2).map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-zinc-100 ring-1 ring-inset ring-white/10"
            title={`Run or sponsored by ${c}`}
          >
            <BuildingIcon size={12} className="text-zinc-400" />
            {c}
          </span>
        ))}
        {h.prizeUsd !== null && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-lo ring-1 ring-inset ring-accent/30"
            title={`$${h.prizeUsd.toLocaleString()} in prizes`}
          >
            <TrophyIcon size={12} />
            {formatPrize(h.prizeUsd)}
          </span>
        )}
      </div>

      {!compact && h.themes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 px-4">
          {h.themes.slice(0, MAX_THEMES).map((t) => (
            <span key={t} className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]">
              {t}
            </span>
          ))}
          {extraThemes > 0 && (
            <span className="px-1 py-0.5 text-[11px] text-zinc-500" title={h.themes.slice(MAX_THEMES).join(", ")}>
              +{extraThemes}
            </span>
          )}
        </div>
      )}

      {/* Pushes the footer to the bottom so footers line up across a row. */}
      <div className={`flex-1 ${compact ? "min-h-3" : "min-h-4"}`} />
      <div className={`flex min-h-12 items-center gap-3 border-t border-line text-xs text-zinc-500 ${compact ? "mx-3.5 py-2" : "mx-4 py-2"}`}>
        {!compact && h.participants !== null && (
          <span className="flex items-center gap-1" title="Registered participants">
            <UsersIcon size={13} />
            {h.participants.toLocaleString()}
          </span>
        )}
        {!!postCount && (
          <Link
            href={`/social?h=${encodeURIComponent(h.id)}`}
            className="relative z-10 flex items-center gap-1 transition-colors hover:text-accent-lo"
            title={`${postCount} Reddit post${postCount > 1 ? "s" : ""} about this hackathon`}
          >
            <ChatIcon size={13} />
            {postCount}
          </Link>
        )}
        <div className="ml-auto flex items-center gap-1">
          <CalendarButton h={h} />
          {tracked && (
            <select
              value={tracked.status}
              onChange={(e) => onStatus(h.id, e.target.value as TrackStatus)}
              className="relative z-10 h-7 rounded-lg border border-line bg-ink pl-2 pr-1 text-xs capitalize text-zinc-200 outline-none transition hover:border-white/15 focus:border-accent/70"
              aria-label={`Status for ${h.title}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </article>
  );
});
