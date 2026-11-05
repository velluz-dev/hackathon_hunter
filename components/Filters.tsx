"use client";

import { useState } from "react";
import { BuildingIcon, ChevronIcon, ClockIcon, SearchIcon, SlidersIcon, SparkIcon, XIcon } from "./icons";
import { DEFAULT_FILTERS, type FilterState, type RegStatus, type SortKey } from "@/lib/filters";
import { chip, field, fieldLabel as label } from "@/lib/ui";

const MODES: { value: FilterState["mode"]; label: string }[] = [
  { value: "all", label: "Any format" },
  { value: "online", label: "Online" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

const REG_STATUSES: [RegStatus, string][] = [
  ["any", "Any status"],
  ["open", "Open for entry"],
  ["started", "Started or closed"],
  ["tba", "No deadline yet"],
];

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
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search name, organizer or theme"
            aria-label="Search hackathons"
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            className={`${field} h-11 pl-10 text-[15px]`}
          />
        </div>
        <select
          aria-label="Sort by"
          value={f.sort}
          onChange={(e) => set("sort", e.target.value as SortKey)}
          className={`${field} h-11 flex-1 sm:w-48 sm:flex-none`}
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
          className={`flex h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition ${
            open || advanced
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"
              : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          <SlidersIcon size={16} />
          Filters
          {advanced > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] text-white">
              {advanced}
            </span>
          )}
          <ChevronIcon size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="no-scrollbar -mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <div role="radiogroup" aria-label="Format" className="flex shrink-0 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
          {MODES.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={f.mode === m.value}
              onClick={() => set("mode", m.value)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-medium transition duration-200 sm:px-3 ${
                f.mode === m.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button onClick={() => set("closingSoon", !f.closingSoon)} aria-pressed={f.closingSoon} className={`${chip(f.closingSoon, "amber")} rounded-lg text-[13px]`}>
          <ClockIcon size={14} />
          Closing this week
        </button>
        <button onClick={() => set("bigTech", !f.bigTech)} aria-pressed={f.bigTech} className={`${chip(f.bigTech)} rounded-lg text-[13px]`}>
          <BuildingIcon size={14} />
          Big tech
        </button>
        {!isDefault && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <XIcon size={14} />
            Clear all
          </button>
        )}
      </div>

      {companies.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">Companies</span>
          <div className="no-scrollbar -mr-3 flex min-w-0 gap-1.5 overflow-x-auto pr-3 sm:mr-0 sm:flex-wrap sm:pr-0">
            {companies.map(([name, count]) => {
              const on = f.companies.includes(name);
              return (
                <button key={name} onClick={() => toggleCompany(name)} aria-pressed={on} className={`${chip(on)} px-2.5 py-0.5`}>
                  {name}
                  <span className={`tabular-nums ${on ? "opacity-70" : "text-zinc-400"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Opens by animating the grid row from 0fr to 1fr; inert keeps the hidden fields out of the tab order. */}
      <div
        id="more-filters"
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-4 space-y-4 border-t border-zinc-100 px-0.5 pb-0.5 pt-4 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <div className="col-span-2 md:col-span-1">
                <label className={label} htmlFor="f-loc">Location</label>
                <input id="f-loc" className={field} placeholder="City or country" value={f.loc} onChange={(e) => set("loc", e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="f-src">Source</label>
                <select id="f-src" className={field} value={f.source} onChange={(e) => set("source", e.target.value as FilterState["source"])}>
                  <option value="all">All sources</option>
                  <option value="devpost">Devpost</option>
                  <option value="mlh">MLH</option>
                  <option value="cerebralvalley">Cerebral Valley</option>
                  <option value="lablab">lablab.ai</option>
                  <option value="luma">Luma</option>
                  <option value="spaceapps">NASA Space Apps</option>
                  <option value="gdg">Google Developer Groups</option>
                  <option value="curated">Local picks</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor="f-prize">Minimum prize</label>
                <select id="f-prize" className={field} value={f.minPrize} onChange={(e) => set("minPrize", Number(e.target.value))}>
                  {[0, 1000, 5000, 10000, 25000, 50000, 100000].map((n) => (
                    <option key={n} value={n}>{n === 0 ? "Any" : `$${n.toLocaleString()}+`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="f-status">Registration</label>
                <select id="f-status" className={field} value={f.status} onChange={(e) => set("status", e.target.value as RegStatus)}>
                  {REG_STATUSES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="f-from">Starts after</label>
                <input id="f-from" type="date" className={field} value={f.from} onChange={(e) => set("from", e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="f-to">Starts before</label>
                <input id="f-to" type="date" className={field} value={f.to} onChange={(e) => set("to", e.target.value)} />
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" role="switch" checked={f.beginner} onChange={(e) => set("beginner", e.target.checked)} className="peer sr-only" />
              <span
                aria-hidden
                className="relative h-5 w-9 shrink-0 rounded-full bg-zinc-200 transition peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-4 dark:bg-zinc-700 dark:peer-focus-visible:ring-offset-zinc-900"
              />
              <span className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-200">
                <SparkIcon size={14} className="text-indigo-500" />
                Beginner friendly
              </span>
            </label>

            {themes.length > 0 && (
              <div>
                <p className={label}>Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {themes.map((t) => (
                    <button key={t} onClick={() => toggleTheme(t)} aria-pressed={f.themes.includes(t)} className={chip(f.themes.includes(t), "indigo")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
