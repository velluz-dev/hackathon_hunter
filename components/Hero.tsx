/** Top of the Browse page: headline, live status and a floating trophy. */
export function Hero({ updated }: { updated: string | null }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-surface/70 px-5 py-8 sm:px-10 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_300px_at_82%_45%,rgb(118_85_255/0.32),transparent_70%),radial-gradient(420px_220px_at_0%_0%,rgb(118_85_255/0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_right,transparent,black_45%,black_70%,transparent)]"
      />

      <div className="relative max-w-xl">
        <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live listings · refreshed daily
          {updated && <span className="text-zinc-500">· updated {updated}</span>}
        </p>
        <h1
          className="animate-rise mt-4 text-[32px] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          Find your next{" "}
          <span className="bg-gradient-to-r from-accent-lo via-[#a58bff] to-accent bg-clip-text text-transparent">hackathon</span>
        </h1>
        <p className="animate-rise mt-3 max-w-md text-[15px] leading-relaxed text-zinc-400 sm:text-base" style={{ animationDelay: "120ms" }}>
          Discover amazing hackathons, build your skills, and be part of the developer community.
        </p>
        <p className="animate-rise mt-4 text-xs leading-relaxed text-zinc-500" style={{ animationDelay: "180ms" }}>
          From Devpost, MLH, Cerebral Valley, lablab.ai, Luma and NASA Space Apps, plus hand-picked local events. Myanmar first.
        </p>
      </div>

      <div className="pointer-events-none absolute right-4 top-1/2 hidden w-[190px] -translate-y-1/2 sm:block lg:right-14 lg:w-[240px]">
        <Trophy />
      </div>
    </section>
  );
}

// A four-point sparkle centred on (x, y).
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

const SPARKLES: [number, number, number, string][] = [
  [200, 36, 9, "0s"],
  [36, 64, 6, "0.9s"],
  [214, 150, 5, "1.6s"],
  [28, 172, 7, "2.2s"],
];

function Trophy() {
  return (
    <svg viewBox="0 0 240 240" aria-hidden className="h-auto w-full">
      <defs>
        <radialGradient id="tr-glow" cx="50%" cy="46%" r="50%">
          <stop offset="0" stopColor="#7655ff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#7655ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tr-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#a8621f" />
          <stop offset="0.27" stopColor="#ffd98a" />
          <stop offset="0.42" stopColor="#fff4d1" />
          <stop offset="0.6" stopColor="#f2b54a" />
          <stop offset="1" stopColor="#9a5719" />
        </linearGradient>
        <linearGradient id="tr-rim" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset="1" stopColor="#e6a23c" />
        </linearGradient>
        <linearGradient id="tr-base" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#a08bff" />
          <stop offset="1" stopColor="#3a1fb8" />
        </linearGradient>
        <linearGradient id="tr-base-top" x1="0" x2="1">
          <stop offset="0" stopColor="#4f33d9" />
          <stop offset="0.5" stopColor="#b9a8ff" />
          <stop offset="1" stopColor="#4f33d9" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="112" r="112" fill="url(#tr-glow)" />
      <ellipse cx="120" cy="226" rx="58" ry="7" fill="#000" opacity="0.45" />

      <g className="animate-float" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <path d="M74 66c-30 0-34 46 6 54" fill="none" stroke="url(#tr-rim)" strokeWidth="9" strokeLinecap="round" />
        <path d="M166 66c30 0 34 46-6 54" fill="none" stroke="url(#tr-rim)" strokeWidth="9" strokeLinecap="round" />
        <path d="M68 52h104v40c0 36-23 62-52 62s-52-26-52-62V52Z" fill="url(#tr-gold)" />
        <ellipse cx="120" cy="52" rx="52" ry="10" fill="url(#tr-rim)" />
        <ellipse cx="120" cy="53.5" rx="44" ry="6.5" fill="#9a5719" opacity="0.55" />
        <path d="M84 66v24c0 20 8 36 20 46" fill="none" stroke="#fffbe8" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" />
        <path d="m120 76 5.3 10.8 11.9 1.7-8.6 8.4 2 11.8L120 103l-10.6 5.7 2-11.8-8.6-8.4 11.9-1.7Z" fill="#fff6d8" opacity="0.92" />
        <path d="M110 152h20l4 24h-28Z" fill="url(#tr-gold)" />
        <path d="M84 176h72l8 18H76Z" fill="url(#tr-base-top)" />
        <rect x="72" y="192" width="96" height="22" rx="5" fill="url(#tr-base)" />
        <rect x="98" y="199" width="44" height="8" rx="2" fill="#fff" opacity="0.18" />
      </g>

      {SPARKLES.map(([x, y, r, delay]) => (
        <path
          key={`${x}-${y}`}
          d={sparkle(x, y, r)}
          fill="#e9e3ff"
          className="animate-twinkle"
          style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: delay }}
        />
      ))}
    </svg>
  );
}
