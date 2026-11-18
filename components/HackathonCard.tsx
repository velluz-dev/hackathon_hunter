"use client";

import { memo } from "react";
import Link from "next/link";
import { CalendarButton, organizer, SaveButton, sourceLabel, Thumb } from "./cardParts";
import { Countdown } from "./Countdown";
import { BuildingIcon, CalendarIcon, ChatIcon, ExternalIcon, GlobeIcon, PencilIcon, PinIcon, TrophyIcon, UsersIcon } from "./icons";
import { hackathonPath } from "@/lib/paths";
import { formatDateRange } from "@/lib/time";
import { iconButton, iconIdle } from "@/lib/ui";
import { STATUSES, type Hackathon, type TrackedItem, type TrackStatus } from "@/lib/types";

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
  /** First seen in this browser recently. */
  isNew?: boolean;
  /** Shows a pencil button (the Saved board uses it for notes). */
  onEdit?: (id: string) => void;
  /** Extra content above the footer, e.g. your notes on the Saved board. */
  children?: React.ReactNode;
  onSave: (h: Hackathon) => void;
  onRemove: (id: string) => void;
  onStatus: (id: string, s: TrackStatus) => void;
}

export const HackathonCard = memo(function HackathonCard({
  h,
  tracked,
  now,
  postCount,
  compact,
  isNew,
  onEdit,
  children,
  onSave,
  onRemove,
  onStatus,
}: Props) {
  const location = h.mode === "hybrid" ? `Hybrid · ${h.location}` : h.location;
  const extraThemes = h.themes.length - MAX_THEMES;
  const companies = h.companies ?? []; // snapshots saved before company tagging have none
  const org = organizer(h);
  // Listed hackathons open their page here; ones added from a link open the link itself.
  const page = hackathonPath(h);
  const titleClass =
    "transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-indigo-600 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-indigo-500 dark:group-hover:text-indigo-400";

  return (
    <article className="group relative flex h-full min-w-0 flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/[0.06] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-black/40">
      <div className={`flex gap-3 ${compact ? "p-3" : "p-4"}`}>
        <Thumb h={h} compact={compact} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500" title={h.organizer ?? undefined}>
            {sourceLabel(h)}
            {org && <span className="normal-case tracking-normal"> · {org}</span>}
          </p>
          <h3 className={`mt-0.5 line-clamp-2 font-semibold leading-snug text-zinc-900 dark:text-zinc-50 ${compact ? "text-sm" : "text-[15px]"}`}>
            {/* The link covers the whole card; buttons and the status menu sit above it. */}
            {page ? (
              <Link href={page} className={titleClass}>
                {h.title}
              </Link>
            ) : (
              <a href={h.url} target="_blank" rel="noopener noreferrer" className={titleClass}>
                {h.title}
              </a>
            )}
          </h3>
        </div>
        <div className="-mr-1 -mt-1">
          <SaveButton h={h} saved={!!tracked} onSave={onSave} onRemove={onRemove} />
        </div>
      </div>

      <div className={`space-y-1 text-sm text-zinc-600 dark:text-zinc-400 ${compact ? "px-3" : "px-4"}`}>
        <p className="flex items-center gap-2">
          <CalendarIcon size={14} className="shrink-0 text-zinc-400" />
          {formatDateRange(h.startDate, h.endDate)}
        </p>
        <p className="flex items-center gap-2" title={location}>
          {h.mode === "online" ? (
            <GlobeIcon size={14} className="shrink-0 text-zinc-400" />
          ) : (
            <PinIcon size={14} className="shrink-0 text-zinc-400" />
          )}
          <span className="truncate">{location}</span>
        </p>
      </div>

      <div className={`mt-3 flex flex-wrap items-center gap-1.5 ${compact ? "px-3" : "px-4"}`}>
        {isNew && (
          <span
            className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-emerald-500/30"
            title="New since you last looked"
          >
            New
          </span>
        )}
        <Countdown deadline={h.deadline} label={h.deadlineLabel} now={now} />
        {companies.slice(0, 2).map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            title={`Run or sponsored by ${c}`}
          >
            <BuildingIcon size={12} />
            {c}
          </span>
        ))}
        {h.prizeUsd !== null && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900"
            title={`$${h.prizeUsd.toLocaleString()} in prizes`}
          >
            <TrophyIcon size={12} />
            {formatPrize(h.prizeUsd)}
          </span>
        )}
      </div>

      {!compact && h.themes.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1 px-4">
          {h.themes.slice(0, MAX_THEMES).map((t) => (
            <span key={t} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {t}
            </span>
          ))}
          {extraThemes > 0 && (
            <span className="px-1 py-0.5 text-[11px] text-zinc-400" title={h.themes.slice(MAX_THEMES).join(", ")}>
              +{extraThemes}
            </span>
          )}
        </div>
      )}

      {children}

      {/* Pushes the footer to the bottom so footers line up across a row. */}
      <div className={`flex-1 ${compact ? "min-h-3" : "min-h-4"}`} />
      <div
        className={`flex min-h-11 items-center gap-3 border-t border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 ${
          compact ? "mx-3 py-2" : "mx-4 py-2"
        }`}
      >
        {!compact && h.participants !== null && (
          <span className="flex items-center gap-1" title="Registered participants">
            <UsersIcon size={13} />
            {h.participants.toLocaleString()}
          </span>
        )}
        {!!postCount && (
          <Link
            href={`/social?h=${encodeURIComponent(h.id)}`}
            className="relative z-10 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
            title={`${postCount} Reddit post${postCount > 1 ? "s" : ""} about this hackathon`}
          >
            <ChatIcon size={13} />
            {postCount}
          </Link>
        )}
        <div className="ml-auto flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(h.id)}
              title="Notes, team and links"
              aria-label={`Notes for ${h.title}`}
              className={`${iconButton} h-7 w-7 rounded-md ${iconIdle}`}
            >
              <PencilIcon size={14} />
            </button>
          )}
          {page && (
            <a
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open on ${sourceLabel(h)}`}
              aria-label={`Open ${h.title} on ${sourceLabel(h)}`}
              className={`${iconButton} h-7 w-7 rounded-md ${iconIdle}`}
            >
              <ExternalIcon size={14} />
            </a>
          )}
          <CalendarButton h={h} />
          {tracked && (
            <select
              value={tracked.status}
              onChange={(e) => onStatus(h.id, e.target.value as TrackStatus)}
              className="relative z-10 h-7 rounded-md border border-zinc-200 bg-white pl-2 pr-1 text-xs capitalize text-zinc-700 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600"
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
