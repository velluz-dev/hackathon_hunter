"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FeaturedCard } from "./FeaturedCard";
import { Filters } from "./Filters";
import { HackathonCard } from "./HackathonCard";
import { Hero } from "./Hero";
import { StatCards, type Stat } from "./StatCards";
import { ArrowRightIcon, BoltIcon, BuildingIcon, FlameIcon, InboxIcon, TrophyIcon, XIcon } from "./icons";
import {
  applyFilters,
  companyCounts,
  DEFAULT_FILTERS,
  filtersFromParams,
  filtersToParams,
  topThemes,
  type FilterState,
} from "@/lib/filters";
import { DAY, useNow } from "@/lib/time";
import { btnGhost, btnPrimary } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";
import type { HackathonsResponse } from "@/lib/types";

const PAGE = 30;
const FEATURED = 8;

function compactUsd(n: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;
}
const count = (n: number) => Math.round(n).toLocaleString();

export function HackathonBrowser({ data, postCounts }: { data: HackathonsResponse; postCounts: Record<string, number> }) {
  const params = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => filtersFromParams(new URLSearchParams(params.toString())));
  const [shown, setShown] = useState(PAGE);
  const now = useNow();
  const { tracked, save, remove, setStatus, syncSnapshots } = useTracker();

  useEffect(() => syncSnapshots(data.hackathons), [data.hackathons, syncSnapshots]);

  // Mirror filters into the URL so a filtered view can be bookmarked or shared.
  useEffect(() => {
    const qs = filtersToParams(filters).toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters]);

  // Before mount `now` is null; the fetch time is close enough for date-based counts.
  const at = now ?? Date.parse(data.fetchedAt);
  const themes = useMemo(() => topThemes(data.hackathons), [data.hackathons]);
  const companies = useMemo(() => companyCounts(data.hackathons), [data.hackathons]);
  // Typing stays responsive: the grid filters against a deferred copy and catches up a moment later.
  const deferred = useDeferredValue(filters);
  const results = useMemo(() => applyFilters(data.hackathons, deferred, at), [data.hackathons, deferred, at]);
  const stale = deferred !== filters;
  const myanmar = useMemo(() => data.hackathons.filter((h) => h.myanmar), [data.hackathons]);

  const totals = useMemo(() => {
    const list = data.hackathons;
    return {
      closingSoon: list.filter((h) => {
        const ms = h.deadline ? Date.parse(h.deadline) - at : -1;
        return ms > 0 && ms <= 7 * DAY;
      }).length,
      bigTech: list.filter((h) => h.companies.length > 0).length,
      prizes: list.reduce((sum, h) => sum + (h.prizeUsd ?? 0), 0),
    };
  }, [data.hackathons, at]);

  const update = (f: FilterState) => {
    setFilters(f);
    setShown(PAGE);
  };

  const stats: Stat[] = [
    {
      label: "Open now",
      value: data.hackathons.length,
      format: count,
      icon: <BoltIcon size={20} />,
      tone: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
      active: false,
      hint: "Show everything",
      onClick: () => update(DEFAULT_FILTERS),
    },
    {
      label: "Closing this week",
      value: totals.closingSoon,
      format: count,
      icon: <FlameIcon size={20} />,
      tone: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
      active: filters.closingSoon,
      hint: "Only show hackathons closing within 7 days",
      onClick: () => update({ ...filters, closingSoon: !filters.closingSoon }),
    },
    {
      label: "Big tech",
      value: totals.bigTech,
      format: count,
      icon: <BuildingIcon size={20} />,
      tone: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
      active: filters.bigTech,
      hint: "Only show hackathons run or sponsored by big tech",
      onClick: () => update({ ...filters, bigTech: !filters.bigTech }),
    },
    {
      label: "Total prizes",
      value: totals.prizes,
      format: compactUsd,
      icon: <TrophyIcon size={20} />,
      tone: "bg-accent/15 text-accent-lo ring-accent/30",
      active: filters.sort === "prize",
      hint: "Sort by biggest prize",
      onClick: () => update({ ...filters, sort: filters.sort === "prize" ? "deadline" : "prize" }),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <Hero updated={now === null ? null : new Date(data.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} />
      <StatCards stats={stats} />

      {!filters.myanmar && (
        <MyanmarSection count={myanmar.length} onShowAll={() => update({ ...DEFAULT_FILTERS, myanmar: true })}>
          {myanmar.slice(0, FEATURED).map((h) => (
            <FeaturedCard key={h.id} h={h} saved={!!tracked[h.id]} now={now} onSave={save} onRemove={remove} />
          ))}
        </MyanmarSection>
      )}

      <div id="discover" className="scroll-mt-20 space-y-4">
        <Filters value={filters} onChange={update} themes={themes} companies={companies} />

        {filters.myanmar && (
          <p className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-zinc-200">
            <span>
              <span aria-hidden>🇲🇲</span> Showing only hackathons in Myanmar.
            </span>
            <button
              onClick={() => update({ ...filters, myanmar: false })}
              className="flex items-center gap-1 font-medium text-accent-lo hover:text-white"
            >
              <XIcon size={14} />
              Show all
            </button>
          </p>
        )}

        {data.errors.length > 0 && (
          <p className="rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-2.5 text-sm text-red-300">
            Couldn&apos;t load {data.errors.map((e) => e.source.toUpperCase()).join(" and ")} right now (
            {data.errors.map((e) => e.message).join("; ")}). Showing the rest.
          </p>
        )}

        <div className="flex items-baseline justify-between gap-4 px-1 pt-2">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {filters.myanmar ? "Myanmar hackathons" : "All hackathons"}
            <span className="ml-2 text-sm font-normal tabular-nums text-zinc-500">
              {results.length === data.hackathons.length ? results.length : `${results.length} of ${data.hackathons.length}`}
            </span>
          </h2>
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-400 ring-1 ring-inset ring-white/10">
              <InboxIcon size={22} />
            </div>
            <p className="mt-4 font-medium text-zinc-100">No hackathons match these filters</p>
            <p className="mt-1 text-sm text-zinc-500">Try widening the dates or removing a category.</p>
            <button onClick={() => update(DEFAULT_FILTERS)} className={`${btnPrimary} mt-5`}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${stale ? "opacity-60" : ""}`}>
            {results.slice(0, shown).map((h) => (
              <HackathonCard
                key={h.id}
                h={h}
                tracked={tracked[h.id]}
                now={now}
                postCount={postCounts[h.id]}
                onSave={save}
                onRemove={remove}
                onStatus={setStatus}
              />
            ))}
          </div>
        )}

        {shown < results.length && (
          <div className="pt-2 text-center">
            <button onClick={() => setShown((n) => n + PAGE)} className={`${btnGhost} h-11 px-5`}>
              Show more <span className="text-zinc-500">· {results.length - shown} left</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const FACEBOOK_SEARCH = "https://www.facebook.com/search/posts?q=hackathon%20myanmar";

/** Myanmar hackathons, pinned above everything else. */
function MyanmarSection({ count, onShowAll, children }: { count: number; onShowAll: () => void; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/[0.16] via-surface to-surface p-4 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <span aria-hidden>🇲🇲</span> Hackathons in Myanmar
            {count > 0 && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold tabular-nums text-accent-lo">{count}</span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-400">Upcoming opportunities, checked every day.</p>
        </div>
        {count > 0 && (
          <button onClick={onShowAll} className="group flex items-center gap-1.5 text-sm font-medium text-accent-lo transition-colors hover:text-white">
            View all Myanmar events
            <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
      {count > 0 ? (
        <div className="no-scrollbar relative -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-1 sm:-mx-6 sm:gap-4 sm:px-6">
          {children}
        </div>
      ) : (
        <p className="relative mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-400">
          None listed online right now.
        </p>
      )}
      <p className="relative mt-3 text-xs leading-relaxed text-zinc-500">
        Most Myanmar hackathons (like KBZPay&apos;s AppCube bootcamp) are only announced on Facebook, which can&apos;t be scraped.{" "}
        <a href={FACEBOOK_SEARCH} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-lo hover:text-white">
          Search Facebook
        </a>{" "}
        and{" "}
        <a href="/saved#add" className="font-medium text-accent-lo hover:text-white">
          add one from its link
        </a>{" "}
        to get countdowns and reminders.
      </p>
    </section>
  );
}
