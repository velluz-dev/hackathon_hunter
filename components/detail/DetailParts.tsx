"use client";

import { useEffect, useState } from "react";
import { Countdown } from "../Countdown";
import { HackathonCard } from "../HackathonCard";
import { SaveButton } from "../cardParts";
import { CheckIcon, CopyIcon, ShareIcon } from "../icons";
import { downloadIcs } from "@/lib/ics";
import { useNow } from "@/lib/time";
import { btnGhost } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";
import { STATUSES, type Hackathon, type TrackStatus } from "@/lib/types";
import { formatInZone } from "@/lib/when";

export function LiveCountdown({ h }: { h: Hackathon }) {
  const now = useNow(30_000);
  return <Countdown deadline={h.deadline} label={h.deadlineLabel} now={now} />;
}

/** The same moment in the viewer's own time zone, shown only when that isn't Yangon time. */
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && !/^Asia\/(Yangon|Rangoon)$/.test(zone)) setText(`${formatInZone(iso, zone)} your time`);
  }, [iso]);
  return text ? <span className="block text-xs text-zinc-500 dark:text-zinc-400">{text}</span> : null;
}

/** Star to save, then a status picker once it's saved. */
export function SaveControls({ h }: { h: Hackathon }) {
  const { tracked, save, remove, setStatus } = useTracker();
  const item = tracked[h.id];
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white pl-1 pr-1.5 dark:border-zinc-700 dark:bg-zinc-900">
      <SaveButton h={h} saved={!!item} onSave={save} onRemove={remove} />
      {item ? (
        <select
          value={item.status}
          onChange={(e) => setStatus(h.id, e.target.value as TrackStatus)}
          aria-label="Status"
          className="h-8 rounded-md bg-transparent pr-1 text-sm capitalize text-zinc-700 outline-none dark:text-zinc-200"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : (
        <span className="pr-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">Save</span>
      )}
    </div>
  );
}

export function DeadlineIcsButton({ h }: { h: Hackathon }) {
  if (!h.deadline) return null;
  return (
    <button onClick={() => downloadIcs(h)} className={btnGhost} title="Download a calendar file with a reminder the day before">
      Deadline reminder (.ics)
    </button>
  );
}

const SHARE_TARGETS: { name: string; style: string; href: (url: string, text: string) => string }[] = [
  { name: "Telegram", style: "bg-[#229ed9] hover:bg-[#1c8bc0]", href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "Viber", style: "bg-[#7360f2] hover:bg-[#5e4bd6]", href: (u, t) => `viber://forward?text=${encodeURIComponent(`${t} ${u}`)}` },
  { name: "Facebook", style: "bg-[#1877f2] hover:bg-[#0b5fcc]", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { name: "WhatsApp", style: "bg-[#25d366] hover:bg-[#1eb457]", href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
  { name: "X", style: "bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600", href: (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "LinkedIn", style: "bg-[#0a66c2] hover:bg-[#004182]", href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
];

/** Share buttons: the phone's own share sheet when there is one, plus direct links and copy. */
export function SharePanel({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canShare && (
          <button onClick={() => navigator.share({ title: text, url }).catch(() => {})} className={btnGhost}>
            <ShareIcon size={15} />
            Share…
          </button>
        )}
        <button onClick={copy} className={btnGhost}>
          {copied ? <CheckIcon size={15} className="text-emerald-600" /> : <CopyIcon size={15} />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {SHARE_TARGETS.map((s) => (
          <a
            key={s.name}
            href={s.href(url, text)}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-white transition ${s.style}`}
          >
            {s.name}
          </a>
        ))}
      </div>
    </div>
  );
}

/** A grid of cards with working save buttons, for lists rendered on the server. */
export function CardGrid({ items, postCounts }: { items: Hackathon[]; postCounts?: Record<string, number> }) {
  const { tracked, save, remove, setStatus } = useTracker();
  const now = useNow();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((h) => (
        <HackathonCard
          key={h.id}
          h={h}
          tracked={tracked[h.id]}
          now={now}
          postCount={postCounts?.[h.id]}
          onSave={save}
          onRemove={remove}
          onStatus={setStatus}
        />
      ))}
    </div>
  );
}
