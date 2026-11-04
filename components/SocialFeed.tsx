"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChatIcon, ExternalIcon, SearchIcon, XIcon } from "./icons";
import { PageHeader } from "./PageHeader";
import { chip, field, panel } from "@/lib/ui";
import { useNow } from "@/lib/time";
import type { Hackathon, PostKind, SocialResponse } from "@/lib/types";

const TABS: { key: PostKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "announcement", label: "Announcements" },
  { key: "team", label: "Looking for team" },
  { key: "discussion", label: "Discussion" },
];

const KIND_STYLE: Record<PostKind, string> = {
  announcement: "bg-accent/15 text-accent-lo ring-accent/30",
  team: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  discussion: "bg-white/[0.05] text-zinc-300 ring-white/10",
};
const KIND_LABEL: Record<PostKind, string> = { announcement: "Announcement", team: "Looking for team", discussion: "Discussion" };

function ago(iso: string, now: number | null): string {
  if (now === null) return "";
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 60) return `${min}m ago`;
  if (min < 1440) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}

export function SocialFeed({ data, hackathons }: { data: SocialResponse; hackathons: Hackathon[] }) {
  const params = useSearchParams();
  const [tab, setTab] = useState<PostKind | "all">("all");
  const [q, setQ] = useState("");
  const [hackathonId, setHackathonId] = useState(params.get("h"));
  const now = useNow();
  const byId = useMemo(() => new Map(hackathons.map((h) => [h.id, h])), [hackathons]);
  const focused = hackathonId ? byId.get(hackathonId) : undefined;

  const scoped = data.posts.filter((p) => {
    if (hackathonId && !p.mentions.includes(hackathonId)) return false;
    const needle = q.trim().toLowerCase();
    return !needle || `${p.title} ${p.excerpt}`.toLowerCase().includes(needle);
  });
  const visible = tab === "all" ? scoped : scoped.filter((p) => p.kind === tab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social"
        icon={<ChatIcon size={20} />}
        description="The latest from r/hackathon and r/hackathons: new events, people looking for teammates, and discussion."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <aside className="lg:order-last lg:sticky lg:top-20 lg:self-start">
          <SearchElsewhere />
        </aside>

        <div className="min-w-0 space-y-4">
          {focused && (
            <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-zinc-200">
              <p className="min-w-0 flex-1 truncate">
                Posts mentioning <strong className="font-semibold text-white">{focused.title}</strong>
              </p>
              <button
                onClick={() => {
                  setHackathonId(null);
                  window.history.replaceState(null, "", window.location.pathname);
                }}
                className="flex shrink-0 items-center gap-1 font-medium text-accent-lo hover:text-white"
              >
                <XIcon size={14} />
                Show all
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {TABS.map((t) => {
                const count = t.key === "all" ? scoped.length : scoped.filter((p) => p.kind === t.key).length;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    aria-pressed={active}
                    className={chip(active)}
                  >
                    {t.label}
                    <span className={`tabular-nums ${active ? "text-accent-lo" : "text-zinc-600"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative sm:ml-auto sm:w-56">
              <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                placeholder="Filter posts"
                aria-label="Filter posts"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`${field} pl-9`}
              />
            </div>
          </div>

          {data.error && (
            <p className="rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-2.5 text-sm text-red-300">
              Couldn&apos;t load Reddit: {data.error}.
            </p>
          )}

          {visible.length === 0 && !data.error ? (
            <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-sm text-zinc-500">
              No posts here.
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((p) => (
                <li
                  key={p.id}
                  className={`${panel} p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-lift sm:p-5`}
                >
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${KIND_STYLE[p.kind]}`}>
                      {KIND_LABEL[p.kind]}
                    </span>
                    <span className="min-w-0 truncate">
                      {p.community} · u/{p.author}
                    </span>
                    <span className="ml-auto shrink-0 tabular-nums">{ago(p.postedAt, now)}</span>
                  </div>
                  <h3 className="mt-2.5 break-words font-semibold leading-snug text-zinc-50">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-lo">
                      {p.title}
                    </a>
                  </h3>
                  {p.excerpt && (
                    <p className="mt-1.5 line-clamp-3 break-words text-sm leading-relaxed text-zinc-400">{p.excerpt}</p>
                  )}
                  {(p.links.length > 0 || p.mentions.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      {p.mentions.map((id) => {
                        const h = byId.get(id);
                        return h ? (
                          <Link
                            key={id}
                            href={`/?q=${encodeURIComponent(h.title)}`}
                            className="max-w-full truncate rounded-md bg-amber-400/10 px-2 py-1 font-medium text-amber-300 ring-1 ring-inset ring-amber-400/25 transition hover:bg-amber-400/15"
                          >
                            {h.title}
                          </Link>
                        ) : null;
                      })}
                      {p.links.slice(0, 3).map((l) => (
                        <a
                          key={l}
                          href={l}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex max-w-[16rem] items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.08]"
                        >
                          <ExternalIcon size={12} className="shrink-0" />
                          <span className="truncate">{new URL(l).hostname.replace(/^www\./, "")}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const PLATFORMS = [
  {
    name: "LinkedIn",
    url: (q: string) => `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(q)}&sortBy=%22date_posted%22`,
    style: "bg-[#0a66c2] hover:bg-[#004182]",
  },
  {
    name: "Facebook",
    url: (q: string) => `https://www.facebook.com/search/posts/?q=${encodeURIComponent(q)}`,
    style: "bg-[#1877f2] hover:bg-[#0b5fcc]",
  },
  {
    name: "Reddit",
    url: (q: string) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}&sort=new`,
    style: "bg-[#ff4500] hover:bg-[#d93a00]",
  },
];

function SearchElsewhere() {
  const [q, setQ] = useState("hackathon registration open");
  return (
    <div className={`${panel} p-4`}>
      <h2 className="text-sm font-semibold text-white">Search LinkedIn &amp; Facebook</h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        They don&apos;t let apps read posts, so this opens their own search. You&apos;ll need to be signed in.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={`${field} mt-3`}
        aria-label="Search terms"
      />
      <div className="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-1">
        {PLATFORMS.map((p) => (
          <a
            key={p.name}
            href={p.url(q)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium text-white transition active:scale-[0.98] ${p.style}`}
          >
            {p.name}
            <ExternalIcon size={13} />
          </a>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        Found one?{" "}
        <Link href="/saved#add" className="font-medium text-accent-lo hover:text-white">
          Add it to Saved
        </Link>{" "}
        for countdowns and reminders.
      </p>
    </div>
  );
}
