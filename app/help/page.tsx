import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ChevronIcon, HelpIcon } from "@/components/icons";
import { LISTED_SOURCES, SOURCE_INFO } from "@/lib/sources/meta";

export const metadata: Metadata = { title: "Help · Hackathon Hunter" };

const SOURCES = LISTED_SOURCES.map((s) => [s === "curated" ? "Local picks" : SOURCE_INFO[s].name, SOURCE_INFO[s].about]);

const link = "font-medium text-indigo-600 hover:underline dark:text-indigo-400";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Where do the listings come from?",
    a: (
      <>
        <p>Every listing is scraped from these sites and refreshed every day. Events that have already ended are dropped.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SOURCES.map(([name, what]) => (
            <li key={name} className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-950/60">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{name}</span>
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
    q: "What's on a hackathon's page?",
    a: (
      <p>
        Tap any card to open its page: the exact times in Yangon time and your own, a timeline of deadlines, prizes, themes, sponsors,
        Reddit posts that mention it, links for finding teammates and similar hackathons. From there you can add it to Google Calendar or
        share it to Telegram, Viber, Facebook, WhatsApp, X or LinkedIn with a preview image. The arrow icon on a card opens the original
        site directly.
      </p>
    ),
  },
  {
    q: "How does saving work?",
    a: (
      <p>
        Tap the star on any card to save it, then track it on the <Link href="/saved" className={link}>Saved</Link> board as
        Interested, Registered, Building or Submitted. Drag cards between columns or change the status on the card. Tap the pencil for
        notes, your team, a repo or demo link and a personal reminder. Finished hackathons move to Past, where you can record whether you
        won, made the finals or took part. Saved hackathons are stored only in this browser: use <strong>Send to phone</strong> to move
        them with a link, or Export and Import in <Link href="/settings" className={link}>Settings</Link>.
      </p>
    ),
  },
  {
    q: "How do deadline reminders work?",
    a: (
      <p>
        Saved hackathons closing within 72 hours, and your own reminders, show up in a banner. If you turn on notifications in{" "}
        <Link href="/settings#notifications" className={link}>Settings</Link>, you&apos;ll also get a browser notification a day before a
        deadline and when a reminder is due, while the site is open in a tab. For reminders that work even when it&apos;s closed, subscribe
        to your saved list in your calendar (Settings or Saved → Subscribe), or use the calendar button on a card.
      </p>
    ),
  },
  {
    q: "Can I get new hackathons in my calendar or feed reader?",
    a: (
      <p>
        Yes. Filter the Browse page the way you like (for example Myanmar only, or online AI hackathons) and press{" "}
        <strong>Subscribe</strong>. You get a calendar link for Google, Apple or Outlook Calendar, an RSS feed and a JSON link for that
        exact view. Calendar apps re-check it every few hours, so new hackathons and changed deadlines appear on their own.
      </p>
    ),
  },
  {
    q: "What does the “New” badge mean?",
    a: (
      <p>
        It marks hackathons that showed up since you last looked, and stays for two days. Use the <strong>New</strong> chip above the
        listings to see only those. It&apos;s tracked in this browser, so nothing is marked on your very first visit.
      </p>
    ),
  },
  {
    q: "Can I use it like an app on my phone?",
    a: (
      <p>
        Yes. Install it from your browser (Android and desktop Chrome or Edge: menu → Install app; iPhone: Share → Add to Home Screen),
        or use the install button in <Link href="/settings#install" className={link}>Settings</Link>. It opens without the browser bars,
        and pages you&apos;ve opened before still work offline.
      </p>
    ),
  },
  {
    q: "What do the countdown colors mean?",
    a: (
      <p>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Green</span> means more than a week to go,{" "}
        <span className="font-medium text-amber-600 dark:text-amber-400">amber</span> means it closes within a week, and{" "}
        <span className="font-medium text-red-600 dark:text-red-400">red</span> means it closes within 48 hours. &ldquo;Happening now&rdquo; marks events
        that have already started.
      </p>
    ),
  },
  {
    q: "Why is a Myanmar hackathon I know about missing?",
    a: (
      <p>
        Many Myanmar hackathons are only announced on Facebook, and Facebook doesn&apos;t let apps read posts (logging in with a bot breaks
        its rules and gets accounts disabled). There are two ways around that, both in{" "}
        <Link href="/settings#facebook" className={link}>Settings → Add hackathons from Facebook</Link>. Follow pages automatically by giving
        the app a feed link for each page (made with rss.app or FetchRSS): their hackathon posts appear in the Myanmar section and in your
        Telegram alerts. Or add a single post: paste its text into <Link href="/saved#add" className={link}>Add from link</Link>, share it
        to the installed app on Android, use the bookmark button on a computer, or forward it to the Telegram bot. The name, deadline,
        dates and place are read from the text (English or Burmese), so check them before saving.
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
            className="animate-rise group rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors open:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:open:border-zinc-700"
            style={{ animationDelay: `${60 + i * 40}ms` }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-5 py-4 text-[15px] font-medium text-zinc-900 transition-colors hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400 [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{q}</span>
              <ChevronIcon size={16} className="shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
