"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, ChatIcon, CompassIcon, GearIcon, HelpIcon, LogoMark, PanelIcon, StarIcon } from "./icons";
import { btnPrimary } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";

const LINKS = [
  { href: "/", label: "Browse", icon: CompassIcon },
  { href: "/social", label: "Social", icon: ChatIcon },
  { href: "/saved", label: "Saved", icon: StarIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
  { href: "/help", label: "Help", icon: HelpIcon },
];

// Nav items are h-10 with a 4px gap, so the active indicator moves in 44px steps.
const ITEM_STRIDE = 44;
const SIDEBAR_KEY = "hackathon-hunter:sidebar";
const LG = "(min-width: 1024px)";

/** "auto": icon rail below lg, full width from lg up. The others are the user's override. */
type SidebarMode = "auto" | "collapsed" | "expanded";

function subscribeLg(onChange: () => void) {
  const m = window.matchMedia(LG);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { tracked } = useTracker();
  const saved = Object.keys(tracked).length;
  const active = LINKS.findIndex((l) => l.href === path);
  const lg = useSyncExternalStore(subscribeLg, () => window.matchMedia(LG).matches, () => true);
  const [mode, setMode] = useState<SidebarMode>("auto");
  // Transitions stay off until the saved preference is applied, so the sidebar doesn't animate on load.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "collapsed") setMode("collapsed");
    } catch {}
    let inner = 0;
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setReady(true))));
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  // Below lg the open sidebar covers the page: close it on navigation or Escape.
  useEffect(() => {
    if (!lg) setMode((m) => (m === "expanded" ? "auto" : m));
  }, [path, lg]);
  useEffect(() => {
    if (lg || mode !== "expanded") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMode("auto");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lg, mode]);

  const wide = mode === "expanded" || (mode === "auto" && lg);
  const toggle = () => {
    const next: SidebarMode = wide ? (lg ? "collapsed" : "auto") : lg ? "auto" : "expanded";
    setMode(next);
    // Only the desktop choice is remembered; the tablet overlay is always temporary.
    if (lg) {
      try {
        localStorage.setItem(SIDEBAR_KEY, next);
      } catch {}
    }
  };
  const motion = ready ? "duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]" : "";

  return (
    <div className="shell" data-sidebar={mode}>
      <aside
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 hidden w-[var(--sb)] flex-col overflow-hidden border-r border-line bg-[#0e0e16]/95 backdrop-blur-xl md:flex ${
          ready ? `transition-[width] ${motion}` : ""
        }`}
      >
        <Link href="/" className="flex h-16 shrink-0 items-center gap-3 px-[22px]" aria-label="Hackathon Hunter home">
          <LogoMark size={32} />
          <span className="sb-fade whitespace-nowrap text-[15px] font-semibold tracking-tight text-white">Hackathon Hunter</span>
        </Link>

        <nav aria-label="Main" className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-3 pt-3">
          <p className="sb-fade mb-2 whitespace-nowrap px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Menu</p>
          <div className="relative">
            {active >= 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-xl bg-accent/15 ring-1 ring-inset ring-accent/30 transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-full before:bg-accent before:shadow-[0_0_10px_rgb(118_85_255/0.9)]"
                style={{ transform: `translateY(${active * ITEM_STRIDE}px)` }}
              />
            )}
            <ul className="relative space-y-1">
              {LINKS.map((l, i) => {
                const on = i === active;
                const Icon = l.icon;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={on ? "page" : undefined}
                      title={wide ? undefined : l.label}
                      className={`group flex h-10 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors ${
                        on ? "text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                      }`}
                    >
                      <span className="relative shrink-0">
                        <Icon size={20} className={`transition-transform duration-200 group-hover:scale-110 ${on ? "text-accent-lo" : ""}`} />
                        {l.href === "/saved" && saved > 0 && (
                          <span className="sb-dot absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0e0e16]" />
                        )}
                      </span>
                      <span className="sb-fade whitespace-nowrap">{l.label}</span>
                      {l.href === "/saved" && saved > 0 && (
                        <span className="sb-fade ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-amber-300">
                          {saved}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="sb-show px-3 pb-3">
          <div className="relative w-[224px] overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/30 via-accent/10 to-transparent p-4">
            <div aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/40 blur-2xl" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-accent/25 text-accent-lo ring-1 ring-inset ring-accent/40">
              <BellIcon size={18} />
            </span>
            <p className="relative mt-3 text-sm font-semibold leading-snug text-white">Never miss a hackathon again!</p>
            <p className="relative mt-1 text-xs leading-relaxed text-zinc-400">Save the ones you like and get reminded before they close.</p>
            <Link href="/#discover" className={`${btnPrimary} relative mt-3 h-9 w-full`}>
              Explore now
            </Link>
          </div>
        </div>

        <div className="border-t border-line p-3">
          <button
            onClick={toggle}
            aria-expanded={wide}
            aria-label={wide ? "Collapse sidebar" : "Expand sidebar"}
            title={wide ? "Collapse sidebar" : "Expand sidebar"}
            className="group flex h-10 w-full items-center gap-3 rounded-xl px-4 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
          >
            <PanelIcon size={20} className={`shrink-0 transition-transform duration-300 ${wide ? "" : "rotate-180"}`} />
            <span className="sb-fade whitespace-nowrap">Collapse</span>
          </button>
        </div>
      </aside>
      <div aria-hidden onClick={() => setMode("auto")} className="sb-backdrop fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" />

      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-line bg-ink/80 px-4 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
          <LogoMark size={28} />
          Hackathon Hunter
        </Link>
      </header>

      <div className={`pl-[var(--main-pl)] ${ready ? `transition-[padding] ${motion}` : ""}`}>
        <main className="mx-auto max-w-[1360px] px-4 pb-28 pt-5 sm:px-6 md:pb-14 md:pt-8 lg:px-10">{children}</main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#0e0e16]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="relative grid grid-cols-5">
          {active >= 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 flex w-1/5 justify-center transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
              style={{ transform: `translateX(${active * 100}%)` }}
            >
              <span className="h-0.5 w-8 rounded-full bg-accent shadow-[0_0_12px_rgb(118_85_255/0.9)]" />
            </span>
          )}
          {LINKS.map((l, i) => {
            const on = i === active;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  on ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <span className="relative">
                  <Icon size={20} className={on ? "text-accent-lo" : ""} />
                  {l.href === "/saved" && saved > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-amber-950">
                      {saved}
                    </span>
                  )}
                </span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
