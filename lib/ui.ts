/** Shared class strings so surfaces, fields and buttons look the same on every page. */

export const panel = "rounded-2xl border border-line bg-surface shadow-card";

export const field =
  "h-10 w-full rounded-xl border border-line bg-ink/70 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/15 focus:border-accent/70 focus:ring-2 focus:ring-accent/25";

export const fieldLabel = "mb-1.5 block text-xs font-medium text-zinc-400";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgb(118_85_255/0.8)] transition hover:bg-accent-hi active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium text-zinc-200 transition hover:border-white/15 hover:bg-raised hover:text-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

/** Small square icon button. Add a color: `iconIdle` or your own text and hover classes. */
export const iconButton = "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition";
export const iconIdle = "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100";

const CHIP_ON = {
  accent: "border-accent/60 bg-accent/15 text-white shadow-[0_0_0_1px_rgb(118_85_255/0.2)]",
  amber: "border-amber-400/50 bg-amber-400/10 text-amber-200",
};

/** A toggleable pill for filters and tabs. */
export function chip(on: boolean, tone: keyof typeof CHIP_ON = "accent"): string {
  return `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition duration-200 ${
    on ? CHIP_ON[tone] : "border-line bg-ink/40 text-zinc-400 hover:border-white/15 hover:text-zinc-100"
  }`;
}
