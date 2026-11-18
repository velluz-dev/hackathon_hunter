"use client";

import { useEffect, useState } from "react";
import { DownloadAppIcon } from "./icons";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// The browser's install prompt arrives once per page load, possibly before a component that
// wants it mounts, so it's kept here and handed to whoever subscribes.
let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

/** Registers the service worker (production only: in dev it would cache files that keep changing). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/** Whether the browser offers installing the app right now, and a function that asks. */
export function useInstall(): { canInstall: boolean; install: () => void; installed: boolean } {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const sync = () => setCanInstall(deferred !== null);
    sync();
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);
  const install = () => {
    const p = deferred;
    if (!p) return;
    p.prompt().catch(() => {});
    p.userChoice.finally(() => {
      deferred = null;
      listeners.forEach((l) => l());
    });
  };
  return { canInstall, install, installed };
}

/** An "Install" icon button that only appears while the browser offers installing. */
export function InstallIconButton({ className }: { className: string }) {
  const { canInstall, install } = useInstall();
  if (!canInstall) return null;
  return (
    <button onClick={install} title="Install as an app" aria-label="Install as an app" className={className}>
      <DownloadAppIcon size={16} />
    </button>
  );
}
