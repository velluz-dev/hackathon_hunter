"use client";

import { useEffect, useState } from "react";
import { ExportButton, ImportButton } from "@/components/DataActions";
import { PageHeader } from "@/components/PageHeader";
import { BellIcon, CalendarPlusIcon, GearIcon, ShieldIcon, TrashIcon } from "@/components/icons";
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
  const [permission, setPermission] = useState<Permission>("unknown");

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" icon={<GearIcon size={20} />} description="Reminders and the data saved in this browser." />

      <Section icon={<BellIcon size={18} />} title="Deadline reminders" id="notifications">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-100">Browser notifications</p>
            <p className="mt-0.5 text-sm text-zinc-400">{PERMISSION_TEXT[permission]}</p>
          </div>
          {permission === "default" && (
            <button onClick={() => Notification.requestPermission().then(setPermission)} className={btnPrimary}>
              Turn on
            </button>
          )}
          {permission === "granted" && (
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
              Enabled
            </span>
          )}
        </div>
        <div className="mt-4 flex gap-3 rounded-xl border border-line bg-ink/40 p-3.5 text-sm text-zinc-400">
          <CalendarPlusIcon size={18} className="mt-0.5 shrink-0 text-zinc-500" />
          <p>
            Want a reminder even when this site is closed? Use the calendar button on any card to add its deadline to your calendar, with
            an alert the day before.
          </p>
        </div>
      </Section>

      <Section icon={<ShieldIcon size={18} />} title="Your data">
        <p className="text-sm leading-relaxed text-zinc-400">
          Your {saved > 0 ? <strong className="font-semibold text-zinc-200">{saved} saved hackathons</strong> : "saved hackathons"} and their
          statuses are stored only in this browser. Nothing is sent to a server. Export a backup to move them to another browser or device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ExportButton />
          <ImportButton />
          <button
            onClick={() => {
              if (confirm(`Remove all ${saved} saved hackathons from this browser? This can't be undone.`)) clear();
            }}
            disabled={saved === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium text-red-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
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
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-300 ring-1 ring-inset ring-white/10">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
