"use client";

import { useState } from "react";
import { safeUrl } from "@/lib/safeUrl";
import { btnGhost, btnPrimary, field, fieldLabel } from "@/lib/ui";
import type { TrackedExtras } from "@/lib/useTracker";
import { RESULTS, STATUSES, type TrackedItem, type TrackResult, type TrackStatus } from "@/lib/types";

export const RESULT_LABELS: Record<TrackResult, string> = {
  won: "🏆 Won",
  finalist: "🥈 Finalist",
  participated: "✅ Took part",
  skipped: "⏭️ Skipped",
};

/** An ISO time as the value a datetime-local input wants (local time, no seconds). */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Notes, team, project link, a personal reminder and the result for one saved hackathon. Rendered inside a Modal. */
export function EditTracked({
  item,
  onSave,
  onClose,
}: {
  item: TrackedItem;
  onSave: (id: string, extras: TrackedExtras, status: TrackStatus) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [team, setTeam] = useState(item.team ?? "");
  const [project, setProject] = useState(item.project ?? "");
  const [remindAt, setRemindAt] = useState(toLocalInput(item.remindAt));
  const [result, setResult] = useState<TrackResult | "">(item.result ?? "");
  const [status, setStatus] = useState<TrackStatus>(item.status);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (project.trim() && !safeUrl(project)) return setError("Enter a link starting with https://");
    onSave(
      item.snapshot.id,
      {
        notes: notes.trim() || undefined,
        team: team.trim() || undefined,
        project: project.trim() ? (safeUrl(project) ?? undefined) : undefined,
        remindAt: remindAt ? new Date(remindAt).toISOString() : undefined,
        result: result || undefined,
      },
      status,
    );
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={fieldLabel} htmlFor="e-notes">Notes</label>
        <textarea
          id="e-notes"
          data-autofocus
          rows={5}
          maxLength={5000}
          placeholder="Ideas, rules to remember, what to build…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabel} htmlFor="e-team">Team</label>
          <input id="e-team" maxLength={300} placeholder="Aung, Su, Min" className={field} value={team} onChange={(e) => setTeam(e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="e-project">Repo, demo or submission</label>
          <input
            id="e-project"
            type="url"
            placeholder="https://github.com/…"
            className={field}
            value={project}
            onChange={(e) => {
              setProject(e.target.value);
              setError(null);
            }}
          />
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <div>
          <label className={fieldLabel} htmlFor="e-remind">Remind me at</label>
          <input id="e-remind" type="datetime-local" className={field} value={remindAt} onChange={(e) => setRemindAt(e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="e-status">Status</label>
          <select id="e-status" className={`${field} capitalize`} value={status} onChange={(e) => setStatus(e.target.value as TrackStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={fieldLabel} htmlFor="e-result">Result, once it&apos;s over</label>
          <select id="e-result" className={field} value={result} onChange={(e) => setResult(e.target.value as TrackResult | "")}>
            <option value="">Not yet</option>
            {RESULTS.map((r) => (
              <option key={r} value={r}>
                {RESULT_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btnGhost}>
          Cancel
        </button>
        <button type="submit" className={btnPrimary}>
          Save
        </button>
      </div>
    </form>
  );
}

/** Your notes, team and project link on a saved card. */
export function TrackedNotes({ item }: { item: TrackedItem }) {
  if (!item.notes && !item.team && !item.project && !item.result) return null;
  return (
    <div className="mx-3 mt-2.5 space-y-1 rounded-lg bg-amber-50/70 px-2.5 py-2 text-xs text-zinc-700 dark:bg-amber-950/20 dark:text-zinc-300">
      {item.result && <p className="font-semibold">{RESULT_LABELS[item.result]}</p>}
      {item.notes && <p className="line-clamp-3 whitespace-pre-line">{item.notes}</p>}
      {item.team && <p className="text-zinc-500">👥 {item.team}</p>}
      {item.project && (
        <a
          href={item.project}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 block truncate font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          🔗 {item.project.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      )}
    </div>
  );
}
