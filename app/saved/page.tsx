"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddFromLink } from "@/components/AddFromLink";
import { ExportButton, ImportButton } from "@/components/DataActions";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { HackathonCard } from "@/components/HackathonCard";
import { Modal } from "@/components/Modal";
import { CardSkeleton } from "@/components/Skeletons";
import { InboxIcon, PlusIcon, StarIcon } from "@/components/icons";
import { useNow } from "@/lib/time";
import { btnGhost, btnPrimary } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";
import { STATUSES, type TrackStatus } from "@/lib/types";

const STATUS_META: Record<TrackStatus, { dot: string; ring: string; hint: string }> = {
  interested: { dot: "bg-sky-500", ring: "ring-sky-400", hint: "Worth a look" },
  registered: { dot: "bg-indigo-500", ring: "ring-indigo-400", hint: "Signed up" },
  building: { dot: "bg-amber-500", ring: "ring-amber-400", hint: "Hacking on it" },
  submitted: { dot: "bg-emerald-500", ring: "ring-emerald-400", hint: "Done!" },
};

// Custom drag type, so dropping a plain link or text onto a column does nothing.
const DRAG_TYPE = "application/x-hackathon-id";

export default function SavedPage() {
  const { tracked, save, remove, setStatus } = useTracker();
  const now = useNow();
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<TrackStatus | null>(null);
  const items = Object.values(tracked).sort((a, b) =>
    (a.snapshot.deadline ?? "9").localeCompare(b.snapshot.deadline ?? "9"),
  );

  // The Social page and Myanmar section link here with #add to open the form directly.
  useEffect(() => {
    if (window.location.hash === "#add") setAdding(true);
  }, []);

  const drop = (status: TrackStatus, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_TYPE);
    if (id) setStatus(id, status);
    setOver(null);
    setDragging(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">Your hackathons</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {items.length
              ? `${items.length} saved · drag a card between columns or change its status`
              : "Track what you're interested in, from first look to submission."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton />
          <ImportButton />
          <button onClick={() => setAdding(true)} className={btnPrimary}>
            <PlusIcon size={16} />
            Add from link
          </button>
        </div>
      </header>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a hackathon from a link"
        description="Found one on LinkedIn, Facebook or anywhere else? Save it here to get the same countdown and reminders."
      >
        <AddFromLink onAdd={(h) => save(h)} onClose={() => setAdding(false)} />
      </Modal>

      <DeadlineBanner />

      {now === null ? (
        // Saved items live in this browser, so there's nothing to show until the page has mounted.
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true">
          {STATUSES.map((s) => (
            <div key={s} className="rounded-2xl bg-zinc-100/70 p-2 dark:bg-zinc-900/50">
              <div className="h-9" />
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="animate-rise rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/50">
            <StarIcon size={22} />
          </div>
          <p className="mt-4 font-medium text-zinc-800 dark:text-zinc-100">Nothing saved yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
            Tap the star on any hackathon to track it here, or add one you found on LinkedIn or Facebook.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Browse hackathons
            </Link>
            <button onClick={() => setAdding(true)} className={btnGhost}>
              Add from link
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => {
            const group = items.filter((t) => t.status === status);
            const meta = STATUS_META[status];
            const isOver = over === status && dragging !== null;
            return (
              <section
                key={status}
                aria-label={status}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (over !== status) setOver(status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
                }}
                onDrop={(e) => drop(status, e)}
                className={`flex flex-col rounded-2xl p-2 transition duration-200 ${
                  isOver ? `bg-white ring-2 ${meta.ring} dark:bg-zinc-900` : "bg-zinc-100/70 dark:bg-zinc-900/50"
                }`}
              >
                <h2 className="flex items-center gap-2 px-2 pb-2.5 pt-1.5">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-100">{status}</span>
                  <span className="rounded-full bg-zinc-200/80 px-1.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {group.length}
                  </span>
                  <span className="ml-auto text-xs text-zinc-400">{meta.hint}</span>
                </h2>
                <div className="flex flex-1 flex-col gap-2">
                  {group.map((t) => (
                    <div
                      key={t.snapshot.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DRAG_TYPE, t.snapshot.id);
                        e.dataTransfer.effectAllowed = "move";
                        // The drag usually starts on the card's link; show the whole card, not a URL.
                        const r = e.currentTarget.getBoundingClientRect();
                        e.dataTransfer.setDragImage(e.currentTarget, e.clientX - r.left, e.clientY - r.top);
                        setDragging(t.snapshot.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      className={`cursor-grab transition-opacity active:cursor-grabbing ${dragging === t.snapshot.id ? "opacity-40" : ""}`}
                    >
                      <HackathonCard h={t.snapshot} tracked={t} now={now} compact onSave={save} onRemove={remove} onStatus={setStatus} />
                    </div>
                  ))}
                  {group.length === 0 && (
                    <div
                      className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-6 text-center text-xs transition ${
                        isOver ? "border-zinc-400 text-zinc-600 dark:border-zinc-500 dark:text-zinc-300" : "border-zinc-300 text-zinc-400 dark:border-zinc-700"
                      }`}
                    >
                      <InboxIcon size={18} />
                      {dragging ? "Drop here" : "Nothing here yet"}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
