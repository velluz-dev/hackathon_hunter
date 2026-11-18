import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Thumb } from "@/components/cardParts";
import { CardGrid, DeadlineIcsButton, LiveCountdown, LocalTime, SaveControls, SharePanel } from "@/components/detail/DetailParts";
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  ChatIcon,
  ExternalIcon,
  GlobeIcon,
  MapIcon,
  PinIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/icons";
import { getHackathons } from "@/lib/aggregate";
import { organizer, sourceLabel } from "@/lib/labels";
import { hackathonPath, idFromParams, siteUrl } from "@/lib/paths";
import { getSocial } from "@/lib/social";
import { similarTo } from "@/lib/similar";
import { isSource } from "@/lib/sources/meta";
import { btnGhost, btnPrimary, panel } from "@/lib/ui";
import type { Hackathon } from "@/lib/types";
import { compactUsd, formatInZone, googleCalendarUrl, isDateOnly, YANGON } from "@/lib/when";

export const revalidate = 1800;

type Params = Promise<{ source: string; id: string }>;

async function find(params: Params) {
  const { source, id } = await params;
  if (!isSource(source)) return null;
  const data = await getHackathons();
  const h = data.hackathons.find((x) => x.id === idFromParams(source, id));
  return h ? { h, data } : null;
}

function when(h: Hackathon): string {
  if (!h.startDate) return "Dates TBA";
  return formatInZone(h.startDate, YANGON, isDateOnly(h));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await find(params);
  if (!found) return { title: "Hackathon not found · Hackathon Hunter" };
  const { h } = found;
  const description = [
    when(h),
    h.mode === "online" ? "Online" : h.location,
    h.prizeUsd ? `${compactUsd(h.prizeUsd)} in prizes` : null,
    h.deadline && h.deadlineLabel !== "Starts" ? `${h.deadlineLabel} ${formatInZone(h.deadline, YANGON, isDateOnly(h))}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title: `${h.title} · Hackathon Hunter`,
    description,
    alternates: { canonical: hackathonPath(h) ?? undefined },
    openGraph: { title: h.title, description, type: "website", siteName: "Hackathon Hunter" },
    twitter: { card: "summary_large_image", title: h.title, description },
  };
}

/** Deadline, start and end in time order, with moments that coincide merged ("Submissions close · Ends"). */
function timeline(h: Hackathon): { label: string; iso: string }[] {
  const steps = [
    h.deadline && h.deadlineLabel !== "Starts" ? { label: h.deadlineLabel, iso: h.deadline } : null,
    h.startDate ? { label: "Starts", iso: h.startDate } : null,
    h.endDate ? { label: "Ends", iso: h.endDate } : null,
  ].filter((s): s is { label: string; iso: string } => s !== null);
  const merged = new Map<string, string[]>();
  for (const s of steps) merged.set(s.iso, [...(merged.get(s.iso) ?? []), s.label]);
  return [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([iso, labels]) => ({ iso, label: labels.join(" · ") }));
}

const fact = "flex gap-3 py-3 first:pt-0 last:pb-0";
const factIcon = "mt-0.5 shrink-0 text-zinc-400";
const factLabel = "text-xs font-medium uppercase tracking-wide text-zinc-400";

export default async function HackathonPage({ params }: { params: Params }) {
  const found = await find(params);
  if (!found) notFound();
  const { h, data } = found;

  const social = await getSocial(data.hackathons);
  const posts = social.posts.filter((p) => p.mentions.includes(h.id)).slice(0, 6);
  const similar = similarTo(h, data.hackathons);
  const base = siteUrl();
  const url = `${base}${hackathonPath(h)}`;
  const dateOnly = isDateOnly(h);
  const steps = timeline(h);
  const now = Date.now();
  const org = organizer(h);
  const source = sourceLabel(h);
  const inPerson = h.mode !== "online" && !/^(tba|online)/i.test(h.location);
  const calEvent = googleCalendarUrl(h, "event", url);
  const calDeadline = h.deadlineLabel !== "Starts" ? googleCalendarUrl(h, "deadline", url) : null;
  const teamQuery = encodeURIComponent(`${h.title} team`);
  const shareText = `${h.title}${h.deadline ? ` · ${h.deadlineLabel.toLowerCase()} ${formatInZone(h.deadline, YANGON, dateOnly)}` : ""}`;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        <ArrowRightIcon size={14} className="rotate-180" />
        All hackathons
      </Link>

      <header className={`${panel} animate-rise overflow-hidden`}>
        <div className="h-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 sm:h-24" />
        <div className="-mt-10 px-5 pb-5 sm:-mt-12 sm:px-7 sm:pb-7">
          <div className="w-fit rounded-2xl bg-white p-1 shadow-md dark:bg-zinc-900">
            <Thumb h={h} large />
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            {source}
            {org && <span className="normal-case tracking-normal"> · {org}</span>}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">{h.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <LiveCountdown h={h} />
            {h.myanmar && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900">
                🇲🇲 Myanmar
              </span>
            )}
            {h.companies.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                <BuildingIcon size={12} />
                {c}
              </span>
            ))}
            {h.prizeUsd !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900">
                <TrophyIcon size={12} />
                {compactUsd(h.prizeUsd)} in prizes
              </span>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a href={h.url} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} h-10 px-4`}>
              Open on {source}
              <ExternalIcon size={15} />
            </a>
            <SaveControls h={h} />
            {calEvent && (
              <a href={calEvent} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                <CalendarIcon size={15} />
                Google Calendar
              </a>
            )}
            {calDeadline && (
              <a href={calDeadline} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                <CalendarIcon size={15} />
                Deadline to Google Calendar
              </a>
            )}
            <DeadlineIcsButton h={h} />
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="font-semibold text-zinc-900 dark:text-white">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {h.description ??
                `${source} doesn't give a description in its listing. Open the original page for the rules, prizes and how to apply.`}
            </p>
            {h.themes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {h.themes.map((t) => (
                  <Link
                    key={t}
                    href={`/?themes=${encodeURIComponent(t)}`}
                    className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}
            {(h.sponsors?.length ?? 0) > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">Sponsors</h3>
                <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{h.sponsors!.join(" · ")}</p>
              </div>
            )}
          </section>

          <section className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                <ChatIcon size={16} className="text-zinc-400" />
                People talking about it
              </h2>
              {posts.length > 0 && (
                <Link href={`/social?h=${encodeURIComponent(h.id)}`} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  See all
                </Link>
              )}
            </div>
            {posts.length > 0 ? (
              <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                {posts.map((p) => (
                  <li key={p.id} className="py-2.5">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-800 hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-400">
                      {p.title}
                    </a>
                    <p className="text-xs text-zinc-500">
                      {p.community} · u/{p.author} · {p.kind === "team" ? "looking for team" : p.kind}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">No Reddit posts mention it yet.</p>
            )}
            <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-950/60">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Find teammates</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <a className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" target="_blank" rel="noopener noreferrer" href={`https://www.reddit.com/search/?q=${teamQuery}&sort=new`}>
                  Reddit
                </a>
                <span className="text-zinc-300">·</span>
                <a className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/search/results/content/?keywords=${teamQuery}&sortBy=%22date_posted%22`}>
                  LinkedIn
                </a>
                <span className="text-zinc-300">·</span>
                <a className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/search/posts/?q=${teamQuery}`}>
                  Facebook
                </a>
                <span className="text-zinc-300">·</span>
                <a className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" target="_blank" rel="noopener noreferrer" href={`https://x.com/search?q=${teamQuery}&f=live`}>
                  X
                </a>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className={`${panel} p-5`}>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className={fact}>
                <CalendarIcon size={16} className={factIcon} />
                <div className="min-w-0 text-sm">
                  <p className={factLabel}>When</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {when(h)}
                    {!dateOnly && h.startDate && <span className="font-normal text-zinc-500"> Yangon time</span>}
                  </p>
                  {!dateOnly && h.startDate && <LocalTime iso={h.startDate} />}
                  {h.endDate && <p className="text-xs text-zinc-500">Until {formatInZone(h.endDate, YANGON, dateOnly)}</p>}
                </div>
              </div>
              <div className={fact}>
                {h.mode === "online" ? <GlobeIcon size={16} className={factIcon} /> : <PinIcon size={16} className={factIcon} />}
                <div className="min-w-0 text-sm">
                  <p className={factLabel}>{h.mode === "online" ? "Online" : h.mode === "hybrid" ? "Hybrid" : "In person"}</p>
                  <p className="break-words font-medium text-zinc-900 dark:text-zinc-100">{h.location}</p>
                  {inPerson && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <MapIcon size={12} />
                      Open in Maps
                    </a>
                  )}
                </div>
              </div>
              {h.prizeUsd !== null && (
                <div className={fact}>
                  <TrophyIcon size={16} className={factIcon} />
                  <div className="text-sm">
                    <p className={factLabel}>Prizes</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">${h.prizeUsd.toLocaleString("en-US")}</p>
                  </div>
                </div>
              )}
              {h.participants !== null && (
                <div className={fact}>
                  <UsersIcon size={16} className={factIcon} />
                  <div className="text-sm">
                    <p className={factLabel}>Registered</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{h.participants.toLocaleString("en-US")}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {steps.length > 0 && (
            <section className={`${panel} p-5`}>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Timeline</h2>
              <ol className="relative space-y-4 border-l border-zinc-200 pl-5 dark:border-zinc-800">
                {steps.map((s) => {
                  const past = Date.parse(s.iso) <= now;
                  return (
                    <li key={s.iso} className="relative">
                      <span
                        className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-zinc-900 ${
                          past ? "bg-zinc-300 dark:bg-zinc-600" : "bg-indigo-500"
                        }`}
                      />
                      <p className={`text-sm font-medium ${past ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900 dark:text-zinc-100"}`}>{s.label}</p>
                      <p className="text-xs text-zinc-500">
                        {formatInZone(s.iso, YANGON, dateOnly)}
                        {!dateOnly && " (Yangon)"}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <section className={`${panel} p-5`}>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Share</h2>
            <SharePanel url={url} text={shareText} />
          </section>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Similar hackathons</h2>
          <CardGrid items={similar} />
        </section>
      )}
    </div>
  );
}
