"use client";

import { useEffect, useState } from "react";
import { Bookmarklet } from "@/components/Bookmarklet";
import { ExportButton, ImportButton } from "@/components/DataActions";
import { PageHeader } from "@/components/PageHeader";
import { useInstall } from "@/components/Pwa";
import { SubscribeButton } from "@/components/SubscribeMenu";
import { SyncButton } from "@/components/SyncLink";
import { BellIcon, CalendarPlusIcon, DownloadAppIcon, GearIcon, LinkIcon, ShieldIcon, TrashIcon } from "@/components/icons";
import { btnPrimary, panel } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";

type Permission = NotificationPermission | "unsupported" | "unknown";

const PERMISSION_TEXT: Record<Permission, string> = {
  unknown: "Checking…",
  unsupported: "This browser doesn't support notifications.",
  default: "Off. Turn them on to get a heads-up a day before a saved hackathon closes.",
  granted: "On. You'll get a notification a day before a saved hackathon closes, while Hackathon Hunter is open in a tab.",
  denied: "Blocked. Allow notifications for this site in your browser's site settings, then reload.",
};

export default function SettingsPage() {
  const { tracked, clear } = useTracker();
  const saved = Object.keys(tracked).length;
  const listedIds = Object.values(tracked)
    .filter((t) => t.snapshot.source !== "manual")
    .map((t) => t.snapshot.id);
  const [permission, setPermission] = useState<Permission>("unknown");
  const { canInstall, install, installed } = useInstall();

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" icon={<GearIcon size={20} />} description="Reminders and the data saved in this browser." />

      <Section icon={<BellIcon size={18} />} title="Deadline reminders" id="notifications">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Browser notifications</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{PERMISSION_TEXT[permission]}</p>
          </div>
          {permission === "default" && (
            <button onClick={() => Notification.requestPermission().then(setPermission)} className={btnPrimary}>
              Turn on
            </button>
          )}
          {permission === "granted" && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
              Enabled
            </span>
          )}
        </div>
        <div className="mt-4 flex gap-3 rounded-xl bg-zinc-50 p-3.5 text-sm text-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-400">
          <CalendarPlusIcon size={18} className="mt-0.5 shrink-0 text-zinc-400" />
          <p>
            Want a reminder even when this site is closed? Use the calendar button on any card to add its deadline to your calendar, with
            an alert the day before.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Your saved list in your calendar</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Subscribe once and Google or Apple Calendar keeps every saved deadline up to date, with reminders a day and 2 hours before.
              Save more and subscribe again to add them.
            </p>
          </div>
          <SubscribeButton query={`ids=${listedIds.join(",")}`} label="Your saved hackathons" disabled={listedIds.length === 0} />
        </div>
      </Section>

      <Section icon={<LinkIcon size={18} />} title="Add hackathons from Facebook" id="facebook">
        <div className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">On a computer</p>
            <p className="mt-0.5">
              Drag this button to your bookmarks bar. Open a post (click its date so the address is the post&apos;s own), select its text,
              and click the bookmark: the post opens in Add from link with the name, deadline, dates and place filled in.
            </p>
            <div className="mt-2.5">
              <Bookmarklet />
            </div>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">On an Android phone</p>
            <p className="mt-0.5">
              Install the app (below), copy the post&apos;s text, then tap Share → Hackathon Hunter. On iPhone, copy the post and paste it
              into Add from link on the Saved page.
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">In Telegram</p>
            <p className="mt-0.5">Forward or paste a post to your Hackathon Hunter bot. It replies with the dates it found and a link that saves it in one tap.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Automatically, from pages you follow</p>
            <p className="mt-0.5">
              Make a feed link for each Facebook page (for example FOSS Myanmar) with a feed service such as rss.app or FetchRSS, and put the
              links in the <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">FACEBOOK_FEEDS</code> setting on Vercel. Every
              hackathon post on those pages then shows up in the Myanmar section and in your Telegram alerts.
            </p>
          </div>
        </div>
      </Section>

      <Section icon={<DownloadAppIcon size={18} />} title="Install the app" id="install">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {installed
            ? "You're using the installed app."
            : "Install Hackathon Hunter on your phone or computer: it opens like an app, without the browser bars, and the pages you've opened work offline."}
        </p>
        {!installed && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {canInstall && (
              <button onClick={install} className={btnPrimary}>
                <DownloadAppIcon size={16} />
                Install app
              </button>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {canInstall
                ? "Or use your browser's menu."
                : "Chrome and Edge: menu → Install app (or Add to Home screen on Android). iPhone and iPad: Share → Add to Home Screen in Safari."}
            </p>
          </div>
        )}
      </Section>

      <Section icon={<ShieldIcon size={18} />} title="Your data">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Your{" "}
          {saved > 0 ? <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{saved} saved hackathons</strong> : "saved hackathons"} and
          their statuses are stored only in this browser. Nothing is sent to a server. Export a backup to move them to another browser or
          device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SyncButton />
          <ExportButton />
          <ImportButton />
          <button
            onClick={() => {
              if (confirm(`Remove all ${saved} saved hackathons from this browser? This can't be undone.`)) clear();
            }}
            disabled={saved === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:border-red-900/70 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <TrashIcon size={16} />
            Clear saved
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, id, children }: { icon: React.ReactNode; title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${panel} animate-rise scroll-mt-20 p-5 sm:p-6`}>
      <h2 className="mb-4 flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
