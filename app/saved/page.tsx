"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddFromLink } from "@/components/AddFromLink";
import { ExportButton, ImportButton } from "@/components/DataActions";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { HackathonCard } from "@/components/HackathonCard";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { CardSkeleton } from "@/components/Skeletons";
import { CompassIcon, InboxIcon, LinkIcon, PlusIcon, StarIcon } from "@/components/icons";
import { useNow } from "@/lib/time";
import { btnGhost, btnPrimary } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";
import { STATUSES, type TrackStatus } from "@/lib/types";

const STATUS_META: Record<TrackStatus, { dot: string; ring: string; hint: string }> = {
  interested: { dot: "bg-sky-400", ring: "ring-sky-400/40", hint: "Worth a look" },
  registered: { dot: "bg-accent", ring: "ring-accent/50", hint: "Signed up" },
  building: { dot: "bg-amber-400", ring: "ring-amber-400/40", hint: "Hacking on it" },
  submitted: { dot: "bg-emerald-400", ring: "ring-emerald-400/40", hint: "Done!" },
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

  const addButton = (
    <button onClick={() => setAdding(true)} className={btnPrimary}>
      <PlusIcon size={16} />
      Add from link
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved hackathons"
        icon={<StarIcon size={20} />}
        description={
          items.length
            ? `${items.length} saved · drag a card between columns or change its status`
            : "Track what you're interested in, from first look to submission."
        }
        actions={
          <>
            <ExportButton />
            <ImportButton />
            {addButton}
          </>
        }
      />

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
            <div key={s} className="rounded-2xl border border-line bg-surface/50 p-2.5">
              <div className="h-8" />
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="animate-rise relative overflow-hidden rounded-3xl border border-dashed border-line px-6 py-16 text-center">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/25">
            <StarIcon size={26} />
          </div>
          <p className="relative mt-5 text-lg font-semibold text-white">Nothing saved yet</p>
          <p className="relative mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-400">
            Tap the star on any hackathon to track it here, or add one you found on LinkedIn or Facebook.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/" className={btnPrimary}>
              <CompassIcon size={16} />
              Browse hackathons
            </Link>
            <button onClick={() => setAdding(true)} className={btnGhost}>
              <LinkIcon size={16} />
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
                className={`flex flex-col rounded-2xl border p-2.5 transition duration-200 ${
                  isOver ? `border-transparent bg-white/[0.04] ring-2 ${meta.ring}` : "border-line bg-surface/50"
                }`}
              >
                <h2 className="flex items-center gap-2 px-1.5 pb-3 pt-1">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="text-sm font-semibold capitalize text-zinc-100">{status}</span>
                  <span className="rounded-full bg-white/[0.06] px-1.5 text-xs font-medium tabular-nums text-zinc-400">{group.length}</span>
                  <span className="ml-auto text-xs text-zinc-500">{meta.hint}</span>
                </h2>
                <div className="flex flex-1 flex-col gap-2.5">
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
                      className={`flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center transition ${
                        isOver ? "border-white/20 text-zinc-300" : "border-line text-zinc-500"
                      }`}
                    >
                      <InboxIcon size={20} />
                      <p className="mt-2 text-xs">{dragging ? "Drop here" : `Nothing ${status} yet`}</p>
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
