import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ChevronIcon, HelpIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Help · Hackathon Hunter" };

const SOURCES = [
  ["Devpost", "Open hackathons with prizes and registration counts"],
  ["MLH", "Major League Hacking's season events"],
  ["Cerebral Valley", "AI hackathons, often sponsored by big tech"],
  ["lablab.ai", "Sponsor-run AI hackathons"],
  ["Luma", "Public hackathon events, with extra searches for Myanmar"],
  ["NASA Space Apps", "Each challenge plus its local events in Myanmar"],
  ["Local picks", "Hand-picked Myanmar events that no site lists"],
];

const link = "font-medium text-accent-lo hover:text-white";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Where do the listings come from?",
    a: (
      <>
        <p>Every listing is scraped from these sites and refreshed every day. Events that have already ended are dropped.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SOURCES.map(([name, what]) => (
            <li key={name} className="rounded-xl border border-line bg-ink/40 px-3 py-2">
              <span className="font-medium text-zinc-200">{name}</span>
              <span className="block text-xs text-zinc-500">{what}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          The <Link href="/social" className={link}>Social</Link> page reads r/hackathon and r/hackathons on Reddit.
        </p>
      </>
    ),
  },
  {
    q: "How does saving work?",
    a: (
      <p>
        Tap the star on any card to save it, then track it on the <Link href="/saved" className={link}>Saved</Link> board as
        Interested, Registered, Building or Submitted. Drag cards between columns or change the status on the card. Saved hackathons are
        stored only in this browser, so use Export and Import in <Link href="/settings" className={link}>Settings</Link> to move them.
      </p>
    ),
  },
  {
    q: "How do deadline reminders work?",
    a: (
      <p>
        Saved hackathons closing within 72 hours show up in a banner. If you turn on notifications in{" "}
        <Link href="/settings#notifications" className={link}>Settings</Link>, you&apos;ll also get a browser notification a day before,
        while the site is open in a tab. For reminders that work even when it&apos;s closed, use the calendar button on a card to add the
        deadline to your calendar.
      </p>
    ),
  },
  {
    q: "What do the countdown colors mean?",
    a: (
      <p>
        <span className="font-medium text-emerald-300">Green</span> means more than a week to go,{" "}
        <span className="font-medium text-amber-300">amber</span> means it closes within a week, and{" "}
        <span className="font-medium text-red-300">red</span> means it closes within 48 hours. &ldquo;Happening now&rdquo; marks events
        that have already started.
      </p>
    ),
  },
  {
    q: "Why is a Myanmar hackathon I know about missing?",
    a: (
      <p>
        Most Myanmar hackathons are only announced on Facebook, which can&apos;t be scraped. Find the post, then use{" "}
        <Link href="/saved#add" className={link}>Add from link</Link> on the Saved page to track it with the same countdown and reminders.
      </p>
    ),
  },
  {
    q: "What counts as “Big tech”?",
    a: (
      <p>
        Hackathons run or sponsored by companies like Google, Meta, Microsoft, Amazon, NVIDIA, OpenAI, Anthropic, IBM, AMD and NASA. They
        are matched by name and by product (a &ldquo;Gemini&rdquo; hackathon counts as Google). Student and community chapters such as
        Google Developer Groups don&apos;t count.
      </p>
    ),
  },
  {
    q: "What does “Beginner friendly” filter on?",
    a: <p>Hackathons whose name or themes mention beginners, such as Devpost&apos;s &ldquo;Beginner Friendly&rdquo; theme.</p>,
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Help" icon={<HelpIcon size={20} />} description="How Hackathon Hunter finds, tracks and reminds you about hackathons." />
      <div className="space-y-3">
        {FAQ.map(({ q, a }, i) => (
          <details
            key={q}
            open={i === 0}
            className="animate-rise group rounded-2xl border border-line bg-surface shadow-card transition-colors open:border-white/[0.1]"
            style={{ animationDelay: `${60 + i * 40}ms` }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-5 py-4 text-[15px] font-medium text-zinc-100 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{q}</span>
              <ChevronIcon size={16} className="shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
