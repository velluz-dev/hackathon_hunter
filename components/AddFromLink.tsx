"use client";

import { useState } from "react";
import { detectCompanies } from "@/lib/companies";
import { isMyanmar } from "@/lib/myanmar";
import { safeUrl } from "@/lib/safeUrl";
import { btnGhost, btnPrimary, field, fieldLabel } from "@/lib/ui";
import type { Hackathon, Mode } from "@/lib/types";

const DEADLINE_TYPES = ["Registration closes", "Submissions close", "Starts"];
const EMPTY = { url: "", title: "", deadline: "", deadlineLabel: DEADLINE_TYPES[0], location: "Online", mode: "online" as Mode };

/**
 * Lets the user track a hackathon they found elsewhere (LinkedIn, Facebook, a friend's message…).
 * Rendered inside a Modal, which supplies the heading.
 */
export function AddFromLink({ onAdd, onClose }: { onAdd: (h: Hackathon) => void; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = safeUrl(form.url);
    if (!url) return setError("Enter a link starting with https://");
    const deadline = form.deadline ? new Date(form.deadline).toISOString() : null;
    const title = form.title.trim();
    onAdd({
      id: `manual:${crypto.randomUUID()}`,
      source: "manual",
      title,
      url,
      image: null,
      startDate: null,
      endDate: null,
      deadline,
      deadlineLabel: form.deadlineLabel,
      location: form.location.trim() || "Online",
      mode: form.mode,
      prizeUsd: null,
      themes: [],
      participants: null,
      organizer: null,
      companies: detectCompanies({ title, organizer: null }),
      myanmar: isMyanmar({ title, location: form.location }),
    });
    setForm(EMPTY);
    onClose();
  };

  return (
    <form id="add" onSubmit={submit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={fieldLabel} htmlFor="a-url">Link to the post or event page</label>
          <input
            id="a-url"
            type="url"
            required
            data-autofocus
            placeholder="https://www.linkedin.com/posts/…"
            className={field}
            value={form.url}
            onChange={(e) => {
              set("url", e.target.value);
              setError(null);
            }}
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
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
