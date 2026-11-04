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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, i) => (
        <StatCard key={s.label} s={s} delay={160 + i * 60} />
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
      className={`group animate-rise flex min-w-0 items-center gap-3 rounded-2xl border p-3.5 text-left transition duration-200 hover:-translate-y-0.5 sm:gap-4 sm:p-5 ${
        s.active ? "border-accent/50 bg-accent/10 shadow-glow" : "border-line bg-surface shadow-card hover:border-white/15 hover:shadow-lift"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-110 sm:h-11 sm:w-11 ${s.tone}`}
      >
        {s.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold tabular-nums tracking-tight text-white sm:text-[26px]">{s.format(n)}</span>
        <span className="block text-xs leading-snug text-zinc-400 sm:text-[13px]">{s.label}</span>
      </span>
    </button>
  );
}
