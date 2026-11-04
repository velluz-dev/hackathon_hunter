"use client";

import { useState } from "react";
import { BuildingIcon, ChevronIcon, FlameIcon, SearchIcon, SlidersIcon, SparkIcon, XIcon } from "./icons";
import { DEFAULT_FILTERS, type FilterState, type RegStatus, type SortKey } from "@/lib/filters";
import { chip, field, fieldLabel } from "@/lib/ui";

const MODES: { value: FilterState["mode"]; label: string }[] = [
  { value: "all", label: "Any format" },
  { value: "online", label: "Online" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

const SOURCES: [FilterState["source"], string][] = [
  ["all", "All sources"],
  ["devpost", "Devpost"],
  ["mlh", "MLH"],
  ["cerebralvalley", "Cerebral Valley"],
  ["lablab", "lablab.ai"],
  ["luma", "Luma"],
  ["spaceapps", "NASA Space Apps"],
  ["curated", "Local picks"],
];

const REG_STATUSES: [RegStatus, string][] = [
  ["any", "Any status"],
  ["open", "Open for entry"],
  ["started", "Started or closed"],
  ["tba", "No deadline yet"],
];

const PRIZES = [0, 1000, 5000, 10000, 25000, 50000, 100000];

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  themes: string[];
  /** Big tech companies in the listings, with how many hackathons each has. */
  companies: [string, number][];
}

/** Number of filters set inside the collapsible panel. */
function advancedCount(f: FilterState): number {
  return [f.loc, f.source !== "all", f.minPrize > 0, f.from, f.to, f.beginner, f.status !== "any"].filter(Boolean).length + f.themes.length;
}

export function Filters({ value: f, onChange, themes, companies }: Props) {
  const advanced = advancedCount(f);
  const [open, setOpen] = useState(advanced > 0);
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...f, [k]: v });
  const toggleTheme = (t: string) =>
    set("themes", f.themes.includes(t) ? f.themes.filter((x) => x !== t) : [...f.themes, t]);
  const toggleCompany = (c: string) =>
    set("companies", f.companies.includes(c) ? f.companies.filter((x) => x !== c) : [...f.companies, c]);
  const isDefault = JSON.stringify(f) === JSON.stringify(DEFAULT_FILTERS);

  return (
    <section aria-label="Search and filters" className="rounded-2xl border border-line bg-surface p-3 shadow-card sm:p-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search name, organizer or theme..."
            aria-label="Search hackathons"
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            className={`${field} h-11 pl-11 text-[15px]`}
          />
        </div>
        <select
          aria-label="Sort by"
          value={f.sort}
          onChange={(e) => set("sort", e.target.value as SortKey)}
          className={`${field} h-11 flex-1 sm:w-52 sm:flex-none`}
        >
          <option value="deadline">Deadline: soonest</option>
          <option value="prize">Prize: highest</option>
          <option value="participants">Most registered</option>
          <option value="newest">Start date: latest</option>
        </select>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="more-filters"
          className={`flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
            open || advanced
              ? "border-accent/50 bg-accent/10 text-white"
              : "border-line bg-ink/70 text-zinc-300 hover:border-white/15 hover:text-white"
          }`}
        >
          <SlidersIcon size={16} />
          More filters
          {advanced > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
              {advanced}
            </span>
          )}
          <ChevronIcon size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="no-scrollbar -mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 sm:-mx-4 sm:px-4 lg:flex-wrap lg:overflow-visible">
        <div role="radiogroup" aria-label="Format" className="flex shrink-0 gap-1.5">
          {MODES.map((m) => (
            <button key={m.value} role="radio" aria-checked={f.mode === m.value} onClick={() => set("mode", m.value)} className={chip(f.mode === m.value)}>
              {m.label}
            </button>
          ))}
        </div>
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
        <button onClick={() => set("closingSoon", !f.closingSoon)} aria-pressed={f.closingSoon} className={chip(f.closingSoon, "amber")}>
          <FlameIcon size={14} />
          Closing this week
        </button>
        <button onClick={() => set("bigTech", !f.bigTech)} aria-pressed={f.bigTech} className={chip(f.bigTech)}>
          <BuildingIcon size={14} />
          Big tech
        </button>
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          disabled={isDefault}
          className="ml-auto inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-35"
        >
          <XIcon size={14} />
          Clear all
        </button>
      </div>

      {companies.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <span className="shrink-0 text-xs font-medium text-zinc-500">Companies</span>
          <div className="no-scrollbar -mr-3 flex min-w-0 gap-1.5 overflow-x-auto pr-3 sm:-mr-4 sm:pr-4 lg:mr-0 lg:flex-wrap lg:overflow-visible lg:pr-0">
            {companies.map(([name, count]) => {
              const on = f.companies.includes(name);
              return (
                <button key={name} onClick={() => toggleCompany(name)} aria-pressed={on} className={`${chip(on)} h-7 px-2.5 text-xs`}>
                  {name}
                  <span className={`tabular-nums ${on ? "text-accent-lo" : "text-zinc-600"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapses by animating the grid row from 0fr to 1fr; inert keeps hidden fields out of the tab order. */}
      <div
        id="more-filters"
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-4 space-y-5 border-t border-line px-0.5 pb-0.5 pt-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              <fieldset className="col-span-2">
                <legend className={fieldLabel}>Start date range</legend>
                <div className="flex items-center gap-2">
                  <input aria-label="Starts after" type="date" className={field} value={f.from} onChange={(e) => set("from", e.target.value)} />
                  <span className="text-zinc-600">–</span>
                  <input aria-label="Starts before" type="date" className={field} value={f.to} onChange={(e) => set("to", e.target.value)} />
                </div>
              </fieldset>
              <div className="col-span-2 md:col-span-1">
                <label className={fieldLabel} htmlFor="f-loc">Location</label>
                <input id="f-loc" className={field} placeholder="City or country" value={f.loc} onChange={(e) => set("loc", e.target.value)} />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="f-prize">Prize amount</label>
                <select id="f-prize" className={field} value={f.minPrize} onChange={(e) => set("minPrize", Number(e.target.value))}>
                  {PRIZES.map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "Any prize" : `$${n.toLocaleString()}+`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="f-status">Registration status</label>
                <select id="f-status" className={field} value={f.status} onChange={(e) => set("status", e.target.value as RegStatus)}>
                  {REG_STATUSES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="f-src">Source</label>
                <select id="f-src" className={field} value={f.source} onChange={(e) => set("source", e.target.value as FilterState["source"])}>
                  {SOURCES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              {themes.length > 0 && (
                <div>
                  <p className={fieldLabel}>Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {themes.map((t) => (
                      <button key={t} onClick={() => toggleTheme(t)} aria-pressed={f.themes.includes(t)} className={`${chip(f.themes.includes(t))} h-7 px-2.5 text-xs`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-between gap-4 self-start rounded-xl border border-line bg-ink/40 px-3.5 py-3 transition hover:border-white/15">
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                    <SparkIcon size={15} className="text-accent-lo" />
                    Beginner friendly
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">Events tagged for first-timers</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={f.beginner}
                  onChange={(e) => set("beginner", e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-10 shrink-0 rounded-full bg-white/10 transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-4"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
