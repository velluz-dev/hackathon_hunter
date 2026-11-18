"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AddFromLink, type AddPrefill } from "@/components/AddFromLink";
import { ExportButton, ImportButton } from "@/components/DataActions";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { EditTracked, TrackedNotes } from "@/components/EditTracked";
import { HackathonCard } from "@/components/HackathonCard";
import { Modal } from "@/components/Modal";
import { CardSkeleton } from "@/components/Skeletons";
import { SubscribeButton } from "@/components/SubscribeMenu";
import { SyncButton, SyncImport } from "@/components/SyncLink";
import { ArchiveIcon, InboxIcon, PlusIcon, StarIcon } from "@/components/icons";
import { DAY, useNow } from "@/lib/time";
import { btnGhost, btnPrimary } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";
import { STATUSES, type Mode, type TrackedItem, type TrackStatus } from "@/lib/types";

const STATUS_META: Record<TrackStatus, { dot: string; ring: string; hint: string }> = {
  interested: { dot: "bg-sky-500", ring: "ring-sky-400", hint: "Worth a look" },
  registered: { dot: "bg-indigo-500", ring: "ring-indigo-400", hint: "Signed up" },
  building: { dot: "bg-amber-500", ring: "ring-amber-400", hint: "Hacking on it" },
  submitted: { dot: "bg-emerald-500", ring: "ring-emerald-400", hint: "Done!" },
};

// Custom drag type, so dropping a plain link or text onto a column does nothing.
const DRAG_TYPE = "application/x-hackathon-id";

/** Over: its end date has passed, or (with no end date) its deadline passed more than a week ago. */
function isPast(t: TrackedItem, now: number): boolean {
  const h = t.snapshot;
  if (h.endDate) return Date.parse(h.endDate) < now;
  return !!h.deadline && Date.parse(h.deadline) < now - 7 * DAY;
}

/**
 * What another app shared here: the phone's share sheet sends ?title=&text=&url=, and the
 * bookmarklet and the Telegram bot send #add?name=&url=&text=&deadline=&label=&start=&end=&location=&mode=
 * (in the #fragment, so long posts never reach the server).
 */
function prefillFromUrl(): AddPrefill | null {
  const hash = window.location.hash;
  const p = new URLSearchParams(hash.startsWith("#add?") ? hash.slice(5) : window.location.search);
  if (!["add", "text", "url", "title", "name"].some((k) => p.has(k))) return null;
  const get = (k: string) => p.get(k)?.slice(0, 5000) || undefined;
  // A shared page's title is often just "Facebook"; it's only worth reading along with the text.
  const sharedTitle = get("title");
  const text = [sharedTitle && !/^(facebook|linkedin|instagram|x|twitter)$/i.test(sharedTitle) ? sharedTitle : "", get("text") ?? ""]
    .filter(Boolean)
    .join("\n");
  return {
    url: get("url"),
    title: get("name"),
    text,
    deadline: get("deadline"),
    deadlineLabel: get("label"),
    start: get("start"),
    end: get("end"),
    location: get("location"),
    mode: get("mode") as Mode | undefined,
  };
}

export default function SavedPage() {
  const { tracked, save, remove, setStatus, update } = useTracker();
  const now = useNow();
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<{ key: number; value?: AddPrefill }>({ key: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<TrackStatus | null>(null);

  const all = useMemo(
    () => Object.values(tracked).sort((a, b) => (a.snapshot.deadline ?? "9").localeCompare(b.snapshot.deadline ?? "9")),
    [tracked],
  );
  const items = now === null ? all : all.filter((t) => !isPast(t, now));
  const past = now === null ? [] : all.filter((t) => isPast(t, now)).reverse();
  const editingItem = editing ? tracked[editing] : undefined;
  // Calendar and RSS can only include hackathons the server lists, not ones added from a link.
  const listedIds = all.filter((t) => t.snapshot.source !== "manual").map((t) => t.snapshot.id);
  const stats = [
    { label: "Saved", value: all.length },
    { label: "Registered", value: all.filter((t) => t.status !== "interested").length },
    { label: "Submitted", value: all.filter((t) => t.status === "submitted").length },
    { label: "Wins & finals", value: all.filter((t) => t.result === "won" || t.result === "finalist").length },
  ];

  // The Social page and Myanmar section link here with #add to open the form directly; shares
  // and the bookmarklet arrive with the post in the query string.
  useEffect(() => {
    const shared = prefillFromUrl();
    if (shared) {
      setPrefill({ key: Date.now(), value: shared });
      setAdding(true);
      window.history.replaceState(null, "", window.location.pathname);
    } else if (window.location.hash === "#add") {
      setAdding(true);
    }
  }, []);

  const openAdd = () => {
    setPrefill({ key: Date.now() });
    setAdding(true);
  };

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
            {all.length
              ? `${items.length} active${past.length ? ` · ${past.length} past` : ""} · drag cards between columns, tap ✎ for notes`
              : "Track what you're interested in, from first look to submission."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SubscribeButton query={`ids=${listedIds.join(",")}`} label="Your saved hackathons" disabled={listedIds.length === 0} />
          <SyncButton />
          <ExportButton />
          <ImportButton />
          <button onClick={openAdd} className={btnPrimary}>
            <PlusIcon size={16} />
            Add from link
          </button>
        </div>
      </header>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a hackathon from a link"
        description="Found one on Facebook, LinkedIn or anywhere else? Paste the post and save it here to get the same countdown and reminders."
      >
        <AddFromLink
          key={prefill.key}
          initial={prefill.value}
          onAdd={(h, notes) => {
            save(h);
            if (notes) update(h.id, { notes });
          }}
          onClose={() => setAdding(false)}
        />
      </Modal>

      <Modal
        open={!!editingItem}
        onClose={() => setEditing(null)}
        title={editingItem?.snapshot.title ?? "Notes"}
        description="Only saved in this browser, and included when you export or send your list to your phone."
      >
        {editingItem && <EditTracked key={editingItem.snapshot.id} item={editingItem} onSave={update} onClose={() => setEditing(null)} />}
      </Modal>

      <SyncImport />
      <DeadlineBanner />

      {all.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

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
      ) : all.length === 0 ? (
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
            <button onClick={openAdd} className={btnGhost}>
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
                      <HackathonCard
                        h={t.snapshot}
                        tracked={t}
                        now={now}
                        compact
                        onEdit={setEditing}
                        onSave={save}
                        onRemove={remove}
                        onStatus={setStatus}
                      >
                        <TrackedNotes item={t} />
                      </HackathonCard>
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

      {past.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
            <ArchiveIcon size={18} className="text-zinc-400" />
            Past hackathons
            <span className="rounded-full bg-zinc-200/80 px-2 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {past.length}
            </span>
          </h2>
          <p className="text-sm text-zinc-500">Finished ones move here. Tap ✎ to record how it went.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {past.map((t) => (
              <HackathonCard
                key={t.snapshot.id}
                h={t.snapshot}
                tracked={t}
                now={now}
                compact
                onEdit={setEditing}
                onSave={save}
                onRemove={remove}
                onStatus={setStatus}
              >
                <TrackedNotes item={t} />
              </HackathonCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
