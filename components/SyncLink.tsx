"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { CheckIcon, CopyIcon, PhoneIcon } from "./icons";
import { decodeSync, encodeSync } from "@/lib/sync";
import { btnGhost, btnPrimary } from "@/lib/ui";
import { countImportable, useTracker } from "@/lib/useTracker";

/** Makes a link that carries your saved list to another device; opening it there offers to import. */
export function SyncButton() {
  const { tracked } = useTracker();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const count = Object.keys(tracked).length;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Descriptions and sponsors come back from the live listings, so leave them out to keep the link short.
    const slim = Object.fromEntries(
      Object.entries(tracked).map(([id, t]) => {
        const { description: _d, sponsors: _s, ...snapshot } = t.snapshot;
        void [_d, _s];
        return [id, { ...t, snapshot }];
      }),
    );
    encodeSync(slim).then((code) => !cancelled && setLink(`${window.location.origin}/saved#sync=${code}`));
    return () => {
      cancelled = true;
    };
  }, [open, tracked]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link", link);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} disabled={count === 0} className={btnGhost} title="Move your saved list to your phone or another browser">
        <PhoneIcon size={16} />
        Send to phone
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Send your list to another device"
        description="Open this link on your phone or another browser and it offers to import your saved hackathons, notes and statuses. The list is inside the link itself, so only share it with yourself."
      >
        <div className="space-y-3">
          <textarea
            readOnly
            rows={3}
            value={link ?? "Making the link…"}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-2 font-mono text-[11px] text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
            aria-label="Sync link"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={copy} disabled={!link} className={btnPrimary}>
              {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              {copied ? "Copied" : "Copy link"}
            </button>
            {link && (
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("My Hackathon Hunter list")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={btnGhost}
              >
                Send in Telegram (Saved Messages)
              </a>
            )}
          </div>
          {link && <p className="text-xs text-zinc-500">{count} hackathons · {Math.ceil(link.length / 1024)} KB link</p>}
        </div>
      </Modal>
    </>
  );
}

/** On /saved#sync=…, asks before importing the list the link carries. */
export function SyncImport() {
  const { importData } = useTracker();
  const [data, setData] = useState<unknown>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    const m = window.location.hash.match(/^#sync=(.+)$/);
    if (!m) return;
    decodeSync(m[1])
      .then((d) => {
        const n = countImportable(d);
        if (n === 0) throw new Error("This link doesn't contain any saved hackathons");
        setData(d);
        setCount(n);
      })
      .catch((e) => setError(e instanceof Error && e.message ? e.message : "This sync link is broken or incomplete"));
  }, []);

  const close = () => {
    setData(null);
    setError(null);
    setDone(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <Modal open={data !== null || error !== null} onClose={close} title={error ? "Couldn't read the sync link" : "Import saved hackathons?"}>
      {error ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}. Copy the whole link again, or use Export and Import.</p>
          <div className="flex justify-end">
            <button onClick={close} className={btnGhost}>
              Close
            </button>
          </div>
        </div>
      ) : done !== null ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Imported {done} hackathons. They&apos;re on your board now.</p>
          <div className="flex justify-end">
            <button onClick={close} className={btnPrimary}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This link has <strong>{count} saved hackathons</strong> from another device. Importing adds them to this browser; anything with the
            same hackathon is replaced by the linked version.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={close} className={btnGhost}>
              Cancel
            </button>
            <button onClick={() => setDone(importData(data))} className={btnPrimary}>
              Import {count}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
