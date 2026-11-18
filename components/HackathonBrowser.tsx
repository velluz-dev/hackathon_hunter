"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filters } from "./Filters";
import { HackathonCard } from "./HackathonCard";
import { StatCards, type Stat } from "./StatCards";
import { SubscribeButton } from "./SubscribeMenu";
import { describeFilters } from "@/lib/select";
import { sourceName } from "@/lib/sources/meta";
import { useFreshIds } from "@/lib/useSeen";
import { BoltIcon, BuildingIcon, FlameIcon, InboxIcon, TrophyIcon } from "./icons";
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
import { btnGhost } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";
import type { HackathonsResponse } from "@/lib/types";

const PAGE = 30;

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
  const ids = useMemo(() => data.hackathons.map((h) => h.id), [data.hackathons]);
  const fresh = useFreshIds(ids);
  const themes = useMemo(() => topThemes(data.hackathons), [data.hackathons]);
  const companies = useMemo(() => companyCounts(data.hackathons), [data.hackathons]);
  // Typing stays responsive: the grid filters against a deferred copy and catches up a moment later.
  const deferred = useDeferredValue(filters);
  const results = useMemo(() => applyFilters(data.hackathons, deferred, at, fresh), [data.hackathons, deferred, at, fresh]);
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
      icon: <BoltIcon size={18} />,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      active: false,
      hint: "Show everything",
      onClick: () => update(DEFAULT_FILTERS),
    },
    {
      label: "Closing this week",
      value: totals.closingSoon,
      format: count,
      icon: <FlameIcon size={18} />,
      tone: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      active: filters.closingSoon,
      hint: "Only show hackathons closing within 7 days",
      onClick: () => update({ ...filters, closingSoon: !filters.closingSoon }),
    },
    {
      label: "Big tech",
      value: totals.bigTech,
      format: count,
      icon: <BuildingIcon size={18} />,
      tone: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
      active: filters.bigTech,
      hint: "Only show hackathons run or sponsored by big tech",
      onClick: () => update({ ...filters, bigTech: !filters.bigTech }),
    },
    {
      label: "In prizes",
      value: totals.prizes,
      format: compactUsd,
      icon: <TrophyIcon size={18} />,
      tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
      active: filters.sort === "prize",
      hint: "Sort by biggest prize",
      onClick: () => update({ ...filters, sort: filters.sort === "prize" ? "deadline" : "prize" }),
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="sr-only">Find your next hackathon</h1>
        <StatCards stats={stats} />
      </header>

      {!filters.myanmar && (
        <MyanmarSection count={myanmar.length} onShowAll={() => update({ ...DEFAULT_FILTERS, myanmar: true })}>
          {myanmar.slice(0, 3).map((h) => (
            <HackathonCard
              key={h.id}
              h={h}
              tracked={tracked[h.id]}
              now={now}
              postCount={postCounts[h.id]}
              isNew={fresh.has(h.id)}
              onSave={save}
              onRemove={remove}
              onStatus={setStatus}
            />
          ))}
        </MyanmarSection>
      )}

      <Filters value={filters} onChange={update} themes={themes} companies={companies} freshCount={fresh.size} />

      {filters.myanmar && (
        <p className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <span>Showing only hackathons in Myanmar.</span>
          <button onClick={() => update({ ...filters, myanmar: false })} className="font-medium underline underline-offset-2">
            Show all
          </button>
        </p>
      )}

      {data.errors.length > 0 && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Couldn&apos;t load {data.errors.map((e) => sourceName(e.source)).join(", ")} right now (
          {data.errors.map((e) => e.message).join("; ")}). Showing the rest.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {results.length === data.hackathons.length
              ? `${results.length} hackathons`
              : `${results.length} of ${data.hackathons.length} hackathons`}
          </p>
          <SourceStatus data={data} now={now} />
        </div>
        <SubscribeButton query={filtersToParams({ ...filters, fresh: false }).toString()} label={describeFilters(filters)} />
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <InboxIcon size={22} />
          </div>
          <p className="mt-4 font-medium text-zinc-700 dark:text-zinc-200">No hackathons match these filters</p>
          <p className="mt-1 text-sm text-zinc-500">Try widening the dates or removing a theme.</p>
          <button
            onClick={() => update(DEFAULT_FILTERS)}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${deferred !== filters ? "opacity-60" : ""}`}>
          {results.slice(0, shown).map((h) => (
            <HackathonCard
              key={h.id}
              h={h}
              tracked={tracked[h.id]}
              now={now}
              postCount={postCounts[h.id]}
              isNew={fresh.has(h.id)}
              onSave={save}
              onRemove={remove}
              onStatus={setStatus}
            />
          ))}
        </div>
      )}

      {shown < results.length && (
        <div className="pt-2 text-center">
          <button onClick={() => setShown((n) => n + PAGE)} className={`${btnGhost} h-10 rounded-xl px-5 shadow-sm`}>
            Show more <span className="text-zinc-400">· {results.length - shown} left</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ago(iso: string, now: number | null): string {
  if (now === null) return "";
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  return min < 1 ? "just now" : min < 60 ? `${min} min ago` : `${Math.round(min / 60)} h ago`;
}

/** "Updated 12 min ago · 12 sources", opening a per-source breakdown. */
function SourceStatus({ data, now }: { data: HackathonsResponse; now: number | null }) {
  const counts = Object.entries(data.counts ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (counts.length === 0) return null;
  return (
    <details className="group relative text-xs text-zinc-500 dark:text-zinc-400">
      <summary className="cursor-pointer list-none hover:text-zinc-800 dark:hover:text-zinc-200 [&::-webkit-details-marker]:hidden">
        {now !== null && `Updated ${ago(data.fetchedAt, now)} · `}
        {counts.length} sources{data.errors.length > 0 && <span className="text-red-500"> · {data.errors.length} down</span>}
      </summary>
      <div className="absolute left-0 top-6 z-30 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <ul className="space-y-1">
          {counts.map(([s, n]) => (
            <li key={s} className="flex justify-between gap-3">
              <span className="text-zinc-700 dark:text-zinc-200">{sourceName(s)}</span>
              <span className="tabular-nums">{n}</span>
            </li>
          ))}
          {data.errors.map((e) => (
            <li key={e.source} className="flex justify-between gap-3 text-red-600 dark:text-red-400">
              <span>{sourceName(e.source)}</span>
              <span>down</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

const FACEBOOK_SEARCH = "https://www.facebook.com/search/posts?q=hackathon%20myanmar";

/** Myanmar hackathons, pinned above everything else. */
function MyanmarSection({ count, onShowAll, children }: { count: number; onShowAll: () => void; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 sm:p-5 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-emerald-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            <span aria-hidden>🇲🇲</span> Hackathons &amp; tech events in Myanmar
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {count > 0 ? `${count} upcoming, checked every day` : "None listed online right now. Checked every day."}
          </p>
        </div>
        {count > 3 && (
          <button onClick={onShowAll} className="group text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            See all {count} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        )}
      </div>
      {count > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Most Myanmar hackathons (like KBZPay&apos;s AppCube bootcamp) are only announced on Facebook, which can&apos;t be
        scraped.{" "}
        <a href={FACEBOOK_SEARCH} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Search Facebook
        </a>{" "}
        and{" "}
        <a href="/saved#add" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          add one from its link
        </a>{" "}
        to get countdowns and reminders.
      </p>
    </section>
  );
}
