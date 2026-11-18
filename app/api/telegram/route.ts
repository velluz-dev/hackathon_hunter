import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { getHackathons } from "@/lib/aggregate";
import { alertNewMyanmarEvents, escapeHtml, link, telegram, when } from "@/lib/alerts";
import { pageUrl } from "@/lib/feeds";
import { applyFilters, DEFAULT_FILTERS, type FilterState } from "@/lib/filters";
import { siteUrl } from "@/lib/paths";
import { parsePost } from "@/lib/postParse";
import { isSource, LISTED_SOURCES, sourceName } from "@/lib/sources/meta";
import type { Hackathon, Source } from "@/lib/types";
import { compactUsd, googleCalendarUrl, remainingText } from "@/lib/when";

// Telegram webhook for the alerts bot. Telegram sends the TELEGRAM_WEBHOOK_SECRET set with
// setWebhook in a header, and only messages from TELEGRAM_CHAT_ID (the owner) get answered.
// Every command answers right away and does its work after the response, because Telegram
// retries webhooks that are slow to answer.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COMMANDS: [string, string][] = [
  ["myanmar", "Upcoming events in Myanmar"],
  ["closing", "Deadlines in the next 3 days (/closing 7 for a week)"],
  ["bigtech", "Hackathons run or sponsored by big tech"],
  ["top", "Biggest prizes still open"],
  ["online", "Online hackathons you can still join"],
  ["search", "Search, e.g. /search ai agents"],
  ["scrape", "Scrape every source now (/scrape luma for one)"],
  ["stats", "How many listings each source has"],
  ["help", "What the bot can do"],
];

const HELP = [
  "<b>Hackathon Hunter bot</b>",
  "",
  ...COMMANDS.map(([c, d]) => `/${c} · ${escapeHtml(d)}`),
  "",
  "Found one on Facebook? Forward or paste the post here and I'll pull out the deadline, dates and place, with a link that saves it in one tap.",
  "",
  "New Myanmar events from every source are also sent to you every morning at 6:30.",
].join("\n");

const MAX_ITEMS = 12;

interface Update {
  message?: {
    chat: { id: number };
    text?: string;
    caption?: string; // forwarded photo posts carry their text here
    entities?: { type: string; url?: string }[];
    caption_entities?: { type: string; url?: string }[];
  };
}

type Reply = (text: string) => Promise<unknown>;

/** A numbered list of hackathons with countdowns, links to their pages and Telegram's 4096-character limit respected. */
function listMessage(header: string, list: Hackathon[], now: number, empty = "Nothing right now."): string {
  const base = siteUrl();
  const lines = list.slice(0, MAX_ITEMS).map((h, i) => {
    const ms = h.deadline ? Date.parse(h.deadline) - now : NaN;
    const countdown = Number.isNaN(ms) ? "No deadline yet" : ms > 0 ? `${h.deadlineLabel} in ${remainingText(ms)}` : h.deadlineLabel === "Starts" ? "Happening now" : "Closed";
    const facts = [
      `⏳ ${escapeHtml(countdown)}`,
      `📍 ${escapeHtml(h.mode === "hybrid" ? `Hybrid · ${h.location}` : h.location)}`,
      h.prizeUsd ? `🏆 ${compactUsd(h.prizeUsd)}` : null,
      h.companies.length ? `🏢 ${escapeHtml(h.companies.slice(0, 2).join(", "))}` : null,
    ].filter(Boolean);
    return `${i + 1}. ${link(pageUrl(h, base), h.title)} · ${escapeHtml(sourceName(h.source))}\n${facts.join(" · ")}`;
  });
  const more = list.length > MAX_ITEMS ? `\n\n…and ${list.length - MAX_ITEMS} more on ${link(base, "Hackathon Hunter")}` : "";
  let text = [header, "", ...(lines.length ? lines : [escapeHtml(empty)])].join("\n\n") + more;
  if (text.length > 4000) text = `${text.slice(0, 3990)}\n…`;
  return text;
}

/** Open for entry: the deadline is ahead, or not announced. */
const isOpen = (h: Hackathon, now: number) => !h.deadline || Date.parse(h.deadline) > now;

const view = (f: Partial<FilterState>) => ({ ...DEFAULT_FILTERS, ...f });

async function scrape(reply: Reply, filter: Source | null) {
  // Drop cached listings so the sources are fetched again, not served from the last 30 minutes.
  revalidatePath("/", "layout");
  const { hackathons, errors } = await getHackathons();
  const now = Date.now();
  const myanmar = hackathons.filter((h) => h.myanmar && (!filter || h.source === filter));
  const alerts = await alertNewMyanmarEvents(hackathons);
  let text = listMessage(
    `🔎 <b>${myanmar.length} event${myanmar.length === 1 ? "" : "s"} in Myanmar</b>${filter ? ` from ${escapeHtml(sourceName(filter))}` : ""} · scraped just now`,
    myanmar,
    now,
    "Nothing listed right now.",
  );
  if (alerts.sent.length) text += `\n\n🆕 ${alerts.sent.length} new, sent above.`;
  if (errors.length) text += `\n\n⚠️ Couldn't reach ${errors.map((e) => escapeHtml(sourceName(e.source))).join(", ")}.`;
  await reply(text);
}

/** A post someone forwarded or pasted: what it says, and links to save it or put its deadline in a calendar. */
async function fromPost(reply: Reply, text: string, linkedUrl: string | null) {
  const p = parsePost(text);
  if (!p.isHackathon && !p.deadline && !p.startDate) {
    return reply(`That doesn't look like a hackathon post, so here's what I can do:\n\n${HELP}`);
  }
  const url = linkedUrl ?? p.url;
  const params = new URLSearchParams();
  const put = (k: string, v: string | null | undefined) => v && params.set(k, v);
  put("name", p.title);
  put("url", url);
  put("deadline", p.deadline);
  put("label", p.deadlineLabel);
  put("start", p.startDate);
  put("end", p.endDate);
  put("location", p.location);
  put("mode", p.mode);
  const saveLink = `${siteUrl()}/saved#add?${params}`;
  const listing: Hackathon = {
    id: "manual:telegram",
    source: "manual",
    title: p.title ?? "Hackathon",
    url: url ?? siteUrl(),
    image: null,
    startDate: p.startDate,
    endDate: p.endDate,
    deadline: p.deadline,
    deadlineLabel: p.deadlineLabel,
    location: p.location ?? "Myanmar",
    mode: p.mode ?? "in-person",
    prizeUsd: p.prizeUsd,
    themes: [],
    participants: null,
    organizer: null,
    companies: [],
    myanmar: true,
  };
  const calendar = googleCalendarUrl(listing, p.deadline && p.deadlineLabel !== "Starts" ? "deadline" : "event");
  return reply(
    [
      `📝 <b>${escapeHtml(p.title ?? "Untitled hackathon")}</b>`,
      p.deadline && p.deadlineLabel !== "Starts"
        ? `⏳ ${escapeHtml(p.deadlineLabel)}: ${escapeHtml(when({ startDate: p.deadline }))} (Yangon time)`
        : "⏳ No deadline found in the post",
      p.startDate ? `📅 ${escapeHtml(when({ startDate: p.startDate }))}${p.endDate && p.endDate.slice(0, 10) !== p.startDate.slice(0, 10) ? ` → ${escapeHtml(when({ startDate: p.endDate }))}` : ""}` : null,
      p.location ? `📍 ${escapeHtml(p.location)}` : null,
      p.prizeUsd ? `🏆 ${compactUsd(p.prizeUsd)}` : null,
      url ? `🔗 ${escapeHtml(url)}` : null,
      "",
      link(saveLink, "➕ Save it in Hackathon Hunter"),
      calendar ? link(calendar, "📆 Add it to Google Calendar") : null,
      "",
      "Check the dates before you rely on them: I read them from the post's text.",
    ]
      .filter((l) => l !== null)
      .join("\n"),
  );
}

async function answer(reply: Reply, name: string, args: string[]) {
  const { hackathons, counts, errors, fetchedAt } = await getHackathons();
  const now = Date.now();
  switch (name) {
    case "/myanmar":
    case "/mm": {
      const list = hackathons.filter((h) => h.myanmar);
      return reply(listMessage(`🇲🇲 <b>${list.length} upcoming in Myanmar</b>`, list, now));
    }
    case "/closing": {
      const days = Math.min(30, Math.max(1, Number(args[0]) || 3));
      const list = hackathons
        .filter((h) => h.deadline && Date.parse(h.deadline) > now && Date.parse(h.deadline) - now <= days * 86_400_000)
        .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
      return reply(listMessage(`⏰ <b>${list.length} deadline${list.length === 1 ? "" : "s"} in the next ${days} day${days === 1 ? "" : "s"}</b>`, list, now));
    }
    case "/bigtech": {
      const list = applyFilters(hackathons, view({ bigTech: true }), now).filter((h) => isOpen(h, now));
      return reply(listMessage(`🏢 <b>${list.length} big tech hackathons open</b>`, list, now));
    }
    case "/top": {
      const list = applyFilters(hackathons, view({ sort: "prize", status: "open" }), now).filter((h) => h.prizeUsd);
      return reply(listMessage("🏆 <b>Biggest prizes still open</b>", list, now));
    }
    case "/online": {
      const list = applyFilters(hackathons, view({ mode: "online", status: "open" }), now);
      return reply(listMessage(`🌐 <b>${list.length} online hackathons open</b>`, list, now));
    }
    case "/search": {
      const q = args.join(" ").trim();
      if (!q) return reply("Send what to look for, e.g. <code>/search ai agents</code> or <code>/search yangon</code>.");
      const list = applyFilters(hackathons, view({ q }), now);
      return reply(listMessage(`🔎 <b>${list.length} result${list.length === 1 ? "" : "s"} for “${escapeHtml(q)}”</b>`, list, now));
    }
    case "/stats": {
      const lines = LISTED_SOURCES.map((s) => `${escapeHtml(sourceName(s))}: ${counts?.[s] ?? 0}${errors.some((e) => e.source === s) ? " ⚠️ down" : ""}`);
      const closing = hackathons.filter((h) => h.deadline && Date.parse(h.deadline) > now && Date.parse(h.deadline) - now <= 7 * 86_400_000).length;
      return reply(
        [
          `📊 <b>${hackathons.length} live listings</b> · updated ${escapeHtml(when({ startDate: fetchedAt }))}`,
          `🇲🇲 ${hackathons.filter((h) => h.myanmar).length} in Myanmar · ⏰ ${closing} closing this week · 🏢 ${hackathons.filter((h) => h.companies.length).length} big tech`,
          "",
          ...lines,
        ].join("\n"),
      );
    }
    default:
      return reply(HELP);
  }
}

export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !chatId || !secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json().catch(() => ({}))) as Update;
  const msg = update.message;
  const text = msg?.text ?? msg?.caption;
  // Anyone can find the bot, but it only works for its owner.
  if (!msg || !text || String(msg.chat.id) !== chatId) return NextResponse.json({ ok: true });

  const [command, ...args] = text.trim().split(/\s+/);
  const name = command.toLowerCase().replace(/@.*$/, ""); // "/scrape@htaFridaybot" in group chats
  const reply: Reply = (text) =>
    telegram(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true } });
  const fail = (e: unknown) => reply(`❌ ${escapeHtml(e instanceof Error ? e.message : String(e))}`);

  if (!name.startsWith("/")) {
    // A forwarded or pasted post. Links hidden behind words come as text_link entities.
    const linked = [...(msg.entities ?? []), ...(msg.caption_entities ?? [])].find((e) => e.type === "text_link" && e.url)?.url ?? null;
    after(() => fromPost(reply, text, linked).catch(fail));
  } else if (name === "/scrape") {
    const arg = args[0]?.toLowerCase();
    const filter = arg && isSource(arg) && arg !== "manual" ? arg : null;
    await reply("⏳ Scraping…");
    after(() => scrape(reply, filter).catch(fail));
  } else if (name === "/start" || name === "/help") {
    after(async () => {
      // Fills Telegram's "/" menu with the commands.
      await telegram(token, "setMyCommands", { commands: COMMANDS.map(([command, description]) => ({ command, description })) }).catch(() => {});
      await reply(HELP);
    });
  } else {
    after(() => answer(reply, name, args).catch(fail));
  }
  return NextResponse.json({ ok: true });
}
