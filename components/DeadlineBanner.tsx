"use client";

import { useEffect, useMemo, useState } from "react";
import { BellIcon, ClockIcon } from "./icons";
import { useTracker } from "@/lib/useTracker";
import { DAY, HOUR, formatRemaining, useNow } from "@/lib/time";

const NOTIFIED_KEY = "hackathon-hunter:notified";
const SHOWN = 3;

/**
 * Lists saved hackathons whose deadline is within 72h and your own reminders due within a day,
 * and fires browser notifications for deadlines within 24h and reminders that are due.
 */
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

  // Your own "remind me at" times: shown from a day before until 12 hours after.
  const reminders = useMemo(
    () =>
      now === null
        ? []
        : Object.values(tracked)
            .filter((t) => {
              const at = t.remindAt ? Date.parse(t.remindAt) : NaN;
              return at - now <= DAY && now - at <= 12 * HOUR;
            })
            .sort((a, b) => a.remindAt!.localeCompare(b.remindAt!)),
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
    // A changed reminder time gets its own key, so it notifies again.
    const dueReminders = reminders.filter((t) => Date.parse(t.remindAt!) <= now && !notified.includes(`remind:${t.snapshot.id}:${t.remindAt}`));
    for (const t of dueReminders) {
      new Notification(`⏰ ${t.snapshot.title}`, { body: t.notes ? t.notes.slice(0, 120) : "Your reminder", tag: `remind:${t.snapshot.id}` });
    }
    if (due.length || dueReminders.length) {
      try {
        const keys = [...due.map((h) => h.id), ...dueReminders.map((t) => `remind:${t.snapshot.id}:${t.remindAt}`)];
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified, ...keys].slice(-500)));
      } catch {}
    }
  }, [permission, now, urgent, reminders]);

  const hasSaved = Object.keys(tracked).length > 0;
  const askPermission = permission === "default" && hasSaved;

  const reminderBox = reminders.length > 0 && now !== null && (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 text-sm dark:border-indigo-900/70 dark:bg-indigo-950/30">
      <p className="flex items-center gap-3 font-semibold text-indigo-900 dark:text-indigo-200">
        <BellIcon size={16} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
        Your reminders
      </p>
      <ul className="mt-2 max-w-2xl space-y-1 pl-7">
        {reminders.map((t) => {
          const ms = Date.parse(t.remindAt!) - now;
          return (
            <li key={t.snapshot.id} className="flex items-baseline gap-3">
              <span className="min-w-0 flex-1 truncate text-indigo-950 dark:text-indigo-100" title={t.notes}>
                {t.snapshot.title}
              </span>
              <span className="shrink-0 text-xs font-medium tabular-nums text-indigo-700 dark:text-indigo-300">
                {ms <= 0 ? "now" : `in ${formatRemaining(ms)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (urgent.length === 0 && !askPermission) return reminderBox || null;

  const notifyButton = askPermission && (
    <button
      onClick={() => Notification.requestPermission().then(setPermission)}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
    >
      <BellIcon size={14} />
      Notify me
    </button>
  );

  if (urgent.length === 0) {
    return (
      <>
        {reminderBox}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <BellIcon size={16} className="shrink-0 text-amber-500" />
          <p className="flex-1 text-zinc-600 dark:text-zinc-300">Get a browser notification when a saved hackathon is a day from closing.</p>
          {notifyButton}
        </div>
      </>
    );
  }

  const list = expanded ? urgent : urgent.slice(0, SHOWN);
  return (
    <>
    {reminderBox}
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm dark:border-amber-900/70 dark:bg-amber-950/30">
      <div className="flex items-center gap-3">
        <ClockIcon size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="flex-1 font-semibold text-amber-900 dark:text-amber-200">
          {urgent.length} saved hackathon{urgent.length > 1 ? "s" : ""} closing within 72 hours
        </p>
        {notifyButton}
      </div>
      <ul className="mt-2 max-w-2xl space-y-1 pl-7">
        {list.map((h) => (
          <li key={h.id} className="flex items-baseline gap-3">
            <a
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-amber-950 hover:underline dark:text-amber-100"
            >
              {h.title}
            </a>
            <span className="shrink-0 text-xs font-medium tabular-nums text-amber-700 dark:text-amber-300">
              {formatRemaining(Date.parse(h.deadline!) - now!)}
            </span>
          </li>
        ))}
      </ul>
      {urgent.length > SHOWN && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-1 pl-7 text-xs font-medium text-amber-700 hover:underline dark:text-amber-300">
          {expanded ? "Show less" : `+${urgent.length - SHOWN} more`}
        </button>
      )}
    </div>
    </>
  );
}
