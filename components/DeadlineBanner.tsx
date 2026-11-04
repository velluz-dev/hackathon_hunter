"use client";

import { useEffect, useMemo, useState } from "react";
import { BellIcon, ClockIcon } from "./icons";
import { useTracker } from "@/lib/useTracker";
import { DAY, formatRemaining, useNow } from "@/lib/time";

const NOTIFIED_KEY = "hackathon-hunter:notified";
const SHOWN = 3;

/** Lists saved hackathons whose deadline is within 72h, and fires browser notifications for those within 24h. */
export function DeadlineBanner() {
  const { tracked } = useTracker();
  const now = useNow();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const urgent = useMemo(
    () =>
      now === null
        ? []
        : Object.values(tracked)
            .map((t) => t.snapshot)
            .filter((h) => {
              const ms = h.deadline ? Date.parse(h.deadline) - now : -1;
              return ms > 0 && ms <= 3 * DAY;
            })
            .sort((a, b) => a.deadline!.localeCompare(b.deadline!)),
    [tracked, now],
  );

  useEffect(() => {
    if (permission !== "granted" || now === null) return;
    let notified: string[] = [];
    try {
      notified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "[]");
    } catch {}
    const due = urgent.filter((h) => Date.parse(h.deadline!) - now <= DAY && !notified.includes(h.id));
    for (const h of due) {
      new Notification(`${h.title}`, {
        body: `${h.deadlineLabel} in ${formatRemaining(Date.parse(h.deadline!) - now)}`,
        tag: h.id,
      });
    }
    if (due.length) {
      try {
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified, ...due.map((h) => h.id)]));
      } catch {}
    }
  }, [permission, now, urgent]);

  const hasSaved = Object.keys(tracked).length > 0;
  const askPermission = permission === "default" && hasSaved;
  if (urgent.length === 0 && !askPermission) return null;

  const notifyButton = askPermission && (
    <button
      onClick={() => Notification.requestPermission().then(setPermission)}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-950 transition hover:bg-amber-300 active:scale-[0.98]"
    >
      <BellIcon size={14} />
      Notify me
    </button>
  );

  if (urgent.length === 0) {
    return (
      <div className="animate-rise flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/20">
          <BellIcon size={16} />
        </span>
        <p className="flex-1 text-zinc-300">Get a browser notification when a saved hackathon is a day from closing.</p>
        {notifyButton}
      </div>
    );
  }

  const list = expanded ? urgent : urgent.slice(0, SHOWN);
  return (
    <div className="animate-rise rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/25">
          <ClockIcon size={16} />
        </span>
        <p className="flex-1 font-semibold text-amber-100">
          {urgent.length} saved hackathon{urgent.length > 1 ? "s" : ""} closing within 72 hours
        </p>
        {notifyButton}
      </div>
      <ul className="mt-2 max-w-2xl space-y-1 pl-11">
        {list.map((h) => (
          <li key={h.id} className="flex items-baseline gap-3">
            <a
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-zinc-200 hover:text-white hover:underline"
            >
              {h.title}
            </a>
            <span className="shrink-0 text-xs font-medium tabular-nums text-amber-300">
              {formatRemaining(Date.parse(h.deadline!) - now!)}
            </span>
          </li>
        ))}
      </ul>
      {urgent.length > SHOWN && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-1 pl-11 text-xs font-medium text-amber-300 hover:underline">
          {expanded ? "Show less" : `+${urgent.length - SHOWN} more`}
        </button>
      )}
    </div>
  );
}
