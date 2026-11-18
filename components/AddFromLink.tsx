"use client";

import { useState } from "react";
import { SparkIcon } from "./icons";
import { detectCompanies } from "@/lib/companies";
import { isMyanmar } from "@/lib/myanmar";
import { parsePost } from "@/lib/postParse";
import { safeUrl } from "@/lib/safeUrl";
import { btnGhost, btnPrimary, field, fieldLabel } from "@/lib/ui";
import type { Hackathon, Mode } from "@/lib/types";

const DEADLINE_TYPES = ["Registration closes", "Applications close", "Submissions close", "Starts"];
const MODES: Mode[] = ["online", "in-person", "hybrid"];

/** What a share, a sync link or the Telegram bot can pre-fill. Dates are ISO strings. */
export interface AddPrefill {
  url?: string;
  title?: string;
  text?: string;
  deadline?: string;
  deadlineLabel?: string;
  start?: string;
  end?: string;
  location?: string;
  mode?: Mode;
}

const EMPTY = {
  text: "",
  url: "",
  title: "",
  deadline: "",
  deadlineLabel: DEADLINE_TYPES[0],
  start: "",
  end: "",
  location: "Online",
  mode: "online" as Mode,
};
type Form = typeof EMPTY;

const pad = (n: number) => String(n).padStart(2, "0");
/** An ISO time as a datetime-local value (in this browser's time zone); "" when it isn't a date. */
function localDateTime(iso?: string): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const localDate = (iso?: string) => localDateTime(iso).slice(0, 10);

/** Fills fields that are still empty (or at their defaults) from the post text. Returns what it found. */
function fillFromText(form: Form): { form: Form; found: string[] } {
  if (!form.text.trim()) return { form, found: [] };
  const p = parsePost(form.text);
  const next = { ...form };
  const found: string[] = [];
  if (!next.url && p.url) next.url = p.url;
  if (!next.title && p.title) {
    next.title = p.title;
    found.push("name");
  }
  if (!next.deadline && p.deadline) {
    next.deadline = localDateTime(p.deadline);
    next.deadlineLabel = p.deadlineLabel;
    found.push(p.deadlineLabel === "Starts" ? "start time" : "deadline");
  }
  if (!next.start && p.startDate) {
    next.start = localDate(p.startDate);
    found.push("dates");
  }
  if (!next.end && p.endDate) next.end = localDate(p.endDate);
  if (next.mode === EMPTY.mode && next.location === EMPTY.location) {
    if (p.mode) next.mode = p.mode;
    if (p.location) {
      next.location = p.location;
      found.push("place");
    }
  }
  return { form: next, found };
}

function initialForm(prefill?: AddPrefill): { form: Form; found: string[] } {
  if (!prefill) return { form: EMPTY, found: [] };
  const form: Form = {
    ...EMPTY,
    text: prefill.text ?? "",
    url: safeUrl(prefill.url) ?? "",
    title: prefill.title ?? "",
    deadline: localDateTime(prefill.deadline),
    deadlineLabel: DEADLINE_TYPES.includes(prefill.deadlineLabel ?? "") ? prefill.deadlineLabel! : EMPTY.deadlineLabel,
    start: localDate(prefill.start),
    end: localDate(prefill.end),
    location: prefill.location ?? EMPTY.location,
    mode: MODES.includes(prefill.mode as Mode) ? prefill.mode! : EMPTY.mode,
  };
  return fillFromText(form);
}

/** A date input's value at a given local hour, as ISO; null when empty. */
const atHour = (date: string, hour: number) => (date ? new Date(`${date}T${pad(hour)}:00`).toISOString() : null);

/**
 * Lets the user track a hackathon they found elsewhere (Facebook, LinkedIn, a friend's message…).
 * Pasting the post's text fills in the name, deadline, dates and place. Rendered inside a Modal,
 * which supplies the heading.
 */
export function AddFromLink({
  onAdd,
  onClose,
  initial,
}: {
  onAdd: (h: Hackathon, notes?: string) => void;
  onClose: () => void;
  initial?: AddPrefill;
}) {
  const [{ form, found }, setState] = useState(() => initialForm(initial));
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setState((s) => ({ ...s, form: { ...s.form, [k]: v } }));
  const fill = (text: string) => setState((s) => fillFromText({ ...s.form, text }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = safeUrl(form.url);
    if (!url) return setError("Enter a link starting with https://");
    const title = form.title.trim();
    const location = form.location.trim() || "Online";
    onAdd(
      {
        id: `manual:${crypto.randomUUID()}`,
        source: "manual",
        title,
        url,
        image: null,
        startDate: atHour(form.start, 9),
        endDate: atHour(form.end || form.start, 18),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        deadlineLabel: form.deadlineLabel,
        location,
        mode: form.mode,
        prizeUsd: form.text ? parsePost(form.text).prizeUsd : null,
        themes: [],
        participants: null,
        organizer: null,
        companies: detectCompanies({ title, organizer: null }),
        myanmar: isMyanmar({ title, location }),
      },
      form.text.trim() ? form.text.trim().slice(0, 3000) : undefined,
    );
    setState({ form: EMPTY, found: [] });
    onClose();
  };

  return (
    <form id="add" onSubmit={submit} className="space-y-5">
      <div>
        <label className={fieldLabel} htmlFor="a-text">
          Paste the post&apos;s text <span className="font-normal text-zinc-400">(optional, fills in the rest)</span>
        </label>
        <textarea
          id="a-text"
          rows={4}
          placeholder="Copy the whole Facebook or LinkedIn post and paste it here…"
          value={form.text}
          onChange={(e) => set("text", e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (!pasted) return;
            e.preventDefault();
            const el = e.currentTarget;
            fill(el.value.slice(0, el.selectionStart) + pasted + el.value.slice(el.selectionEnd));
          }}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600"
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={found.length ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500"}>
            {found.length
              ? `Filled in the ${found.join(", ")}. Check them below.`
              : form.text.trim()
                ? "No dates found in that text. Fill them in below."
                : "Dates in English or Burmese both work."}
          </span>
          {form.text.trim() && (
            <button type="button" onClick={() => fill(form.text)} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              <SparkIcon size={12} />
              Fill in from text
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={fieldLabel} htmlFor="a-url">Link to the post or event page</label>
          <input
            id="a-url"
            type="url"
            required
            data-autofocus
            placeholder="https://www.facebook.com/…"
            className={field}
            value={form.url}
            onChange={(e) => {
              set("url", e.target.value);
              setError(null);
            }}
          />
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={fieldLabel} htmlFor="a-title">Name</label>
          <input id="a-title" required className={field} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="a-dl">Deadline</label>
          <input id="a-dl" type="datetime-local" className={field} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="a-dlt">The deadline is when…</label>
          <select id="a-dlt" className={field} value={form.deadlineLabel} onChange={(e) => set("deadlineLabel", e.target.value)}>
            {DEADLINE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={fieldLabel} htmlFor="a-start">Starts</label>
          <input id="a-start" type="date" className={field} value={form.start} onChange={(e) => set("start", e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="a-end">Ends</label>
          <input id="a-end" type="date" className={field} value={form.end} onChange={(e) => set("end", e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="a-mode">Format</label>
          <select id="a-mode" className={field} value={form.mode} onChange={(e) => set("mode", e.target.value as Mode)}>
            <option value="online">Online</option>
            <option value="in-person">In person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label className={fieldLabel} htmlFor="a-loc">Location</label>
          <input id="a-loc" className={field} value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btnGhost}>
          Cancel
        </button>
        <button type="submit" className={btnPrimary}>
          Save hackathon
        </button>
      </div>
    </form>
  );
}
