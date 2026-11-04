"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GearIcon, HelpIcon, LogoMark } from "./icons";
import { useTracker } from "@/lib/useTracker";

const LINKS = [
  { href: "/", label: "Browse" },
  { href: "/social", label: "Social" },
  { href: "/saved", label: "Saved" },
];

// Shown as icons to keep the bar short on phones.
const ICON_LINKS = [
  { href: "/settings", label: "Settings", icon: GearIcon },
  { href: "/help", label: "Help", icon: HelpIcon },
];

export function Nav() {
  const path = usePathname();
  const { tracked } = useTracker();
  const count = Object.keys(tracked).length;
  const navRef = useRef<HTMLElement>(null);
  // Position of the sliding highlight behind the active link; null until measured, when the link styles itself.
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      setPill(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    // The Saved badge appearing or a font loading changes link widths.
    const ro = new ResizeObserver(measure);
    nav.querySelectorAll("a").forEach((a) => ro.observe(a));
    return () => ro.disconnect();
  }, [path, count]);

  const linkClass = (active: boolean) =>
    `relative z-10 flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
      active
        ? `text-zinc-900 dark:text-white ${pill ? "" : "bg-white shadow-sm dark:bg-zinc-800"}`
        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-zinc-900 dark:text-white">
          <LogoMark />
          <span className="hidden sm:inline">Hackathon Hunter</span>
        </Link>
        <nav ref={navRef} aria-label="Main" className="relative ml-auto flex items-center gap-0.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
          {pill && (
            <span
              aria-hidden
              className="absolute inset-y-1 rounded-lg bg-white shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] dark:bg-zinc-800"
              style={{ left: pill.left, width: pill.width }}
            />
          )}
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={`${linkClass(active)} px-3 py-1.5`}>
                {l.label}
                {l.href === "/saved" && count > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-semibold text-amber-950">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
          <span aria-hidden className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          {ICON_LINKS.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={label}
                className={`${linkClass(active)} h-8 w-8 justify-center`}
              >
                <Icon size={16} />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
