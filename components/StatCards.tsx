"use client";

import { useCountUp } from "@/lib/useCountUp";

export interface Stat {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: React.ReactNode;
  /** Classes for the icon tile. */
  tone: string;
  active: boolean;
  /** What clicking the card does. */
  hint: string;
  onClick: () => void;
}

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {stats.map((s, i) => (
        <StatCard key={s.label} s={s} delay={120 + i * 50} />
      ))}
    </div>
  );
}

function StatCard({ s, delay }: { s: Stat; delay: number }) {
  const n = useCountUp(s.value);
  return (
    <button
      onClick={s.onClick}
      aria-pressed={s.active}
      title={s.hint}
      style={{ animationDelay: `${delay}ms` }}
      className={`group animate-rise flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition duration-200 hover:-translate-y-0.5 sm:px-4 sm:py-3 ${
        s.active
          ? "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/50"
          : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-900/[0.05] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10 ${s.tone}`}
      >
        {s.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
          {s.format(n)}
        </span>
        <span className="block text-[11px] leading-tight text-zinc-500 sm:text-xs dark:text-zinc-400">{s.label}</span>
      </span>
    </button>
  );
}
