/** Shared class strings so surfaces, fields and buttons look the same on every page. */

export const panel =
  "rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:border-zinc-800 dark:bg-zinc-900";

export const field =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600";

export const fieldLabel = "mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400";

export const btnPrimary =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

/** Small square icon button. Add a color: `iconIdle` or your own text and hover classes. */
export const iconButton = "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition";
export const iconIdle =
  "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

const CHIP_ON = {
  dark: "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900",
  indigo: "border-indigo-600 bg-indigo-600 text-white",
  amber: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
};

/** A toggleable pill for filters. */
export function chip(on: boolean, tone: keyof typeof CHIP_ON = "dark"): string {
  return `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition duration-200 ${
    on
      ? CHIP_ON[tone]
      : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
  }`;
}
