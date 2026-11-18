"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { BellIcon, CalendarIcon, CheckIcon, CopyIcon, ExternalIcon, RssIcon } from "./icons";
import { btnGhost } from "@/lib/ui";

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex gap-1.5">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Link"
        className="h-8 min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 font-mono text-[11px] text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
      />
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            window.prompt("Copy this link", value);
          }
        }}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-zinc-200 px-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {copied ? <CheckIcon size={13} className="text-emerald-600" /> : <CopyIcon size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

const option = "rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800";
const action =
  "inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700";

/**
 * Calendar, RSS and JSON links for a view. `query` is the view's filters as URL parameters
 * (the Browse page's own query string) or `ids=…` for a saved list.
 */
export function SubscribeButton({ query, label, disabled }: { query: string; label: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const qs = query ? `?${query}` : "";
  const ics = `${origin}/api/calendar${qs}`;
  const webcal = ics.replace(/^https?:/, "webcal:");
  const local = /\/\/(localhost|127\.0\.0\.1)/.test(origin);

  return (
    <>
      <button onClick={() => setOpen(true)} disabled={disabled} className={btnGhost} title="Get this list in your calendar or feed reader">
        <BellIcon size={15} />
        Subscribe
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Subscribe to this list"
        description={`${label}. Calendar apps and feed readers check for changes every few hours, so new hackathons and deadlines show up without opening this site.`}
      >
        <div className="space-y-3 text-sm">
          {local && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              You&apos;re on localhost, which calendar apps can&apos;t reach. These links work once the site is deployed.
            </p>
          )}
          <div className={option}>
            <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
              <CalendarIcon size={16} className="text-indigo-500" />
              Calendar
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Each hackathon&apos;s dates, plus its deadline with reminders a day and 2 hours before.</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noopener noreferrer" className={action}>
                Google Calendar
                <ExternalIcon size={12} />
              </a>
              <a href={webcal} className={action}>
                Apple / Outlook
              </a>
            </div>
            <CopyRow value={ics} />
          </div>
          <div className={option}>
            <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
              <RssIcon size={16} className="text-orange-500" />
              RSS feed
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">For feed readers, or a Telegram or Discord RSS bot.</p>
            <CopyRow value={`${origin}/feed.xml${qs}`} />
          </div>
          <div className={option}>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">JSON</p>
            <p className="mt-0.5 text-xs text-zinc-500">The same list for your own scripts. Add &amp;limit=10 to shorten it.</p>
            <CopyRow value={`${origin}/api/hackathons${qs}`} />
          </div>
        </div>
      </Modal>
    </>
  );
}
