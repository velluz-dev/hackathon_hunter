import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { getHackathons } from "@/lib/aggregate";
import { alertNewMyanmarEvents, escapeHtml, telegram, when } from "@/lib/alerts";
import type { Hackathon, Source } from "@/lib/types";

// Telegram webhook for the alerts bot. Telegram sends the TELEGRAM_WEBHOOK_SECRET set with
// setWebhook in a header, and only messages from TELEGRAM_CHAT_ID (the owner) get answered.
//   /scrape        scrape now and list every Myanmar event (new Luma ones are announced too)
//   /scrape luma   only Luma events; any source name works ("gdg", "spaceapps", ...)
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOURCE_NAMES: Partial<Record<Source, string>> = {
  devpost: "Devpost",
  mlh: "MLH",
  cerebralvalley: "Cerebral Valley",
  lablab: "lablab.ai",
  luma: "Luma",
  spaceapps: "NASA Space Apps",
  gdg: "Google Developer Groups",
  curated: "Local pick",
};

const HELP = [
  "<b>Hackathon Hunter bot</b>",
  "",
  "/scrape · scrape now and list every event in Myanmar",
  "/scrape luma · only Luma (or gdg, spaceapps, curated…)",
  "/help · this message",
  "",
  "New Myanmar events on Luma are also sent to you every morning at 6:30.",
].join("\n");

interface Update {
  message?: { chat: { id: number }; text?: string };
}

function eventList(events: Hackathon[], filter: string | null): string {
  const header = `🔎 <b>${events.length} event${events.length === 1 ? "" : "s"} in Myanmar</b>${filter ? ` from ${escapeHtml(SOURCE_NAMES[filter as Source] ?? filter)}` : ""} · scraped just now`;
  const lines = events.map(
    (h, i) =>
      `${i + 1}. <b>${escapeHtml(h.title)}</b> · ${escapeHtml(SOURCE_NAMES[h.source] ?? h.source)}\n📅 ${escapeHtml(when(h))} · 📍 ${escapeHtml(h.location)}\n${h.url}`,
  );
  // Telegram caps a message at 4096 characters.
  let text = [header, "", ...(lines.length ? lines : ["Nothing listed right now."])].join("\n\n");
  if (text.length > 4000) text = `${text.slice(0, 3990)}\n…`;
  return text;
}

async function scrape(token: string, chatId: string, filter: string | null) {
  // Drop cached listings so the sources are fetched again, not served from the last 30 minutes.
  revalidatePath("/", "layout");
  const { hackathons, errors } = await getHackathons();
  const myanmar = hackathons.filter((h) => h.myanmar && (!filter || h.source === filter));
  const alerts = await alertNewMyanmarEvents(hackathons);

  let text = eventList(myanmar, filter);
  if (alerts.sent.length) text += `\n\n🆕 ${alerts.sent.length} new on Luma, sent above.`;
  if (errors.length) text += `\n\n⚠️ Couldn't reach ${errors.map((e) => SOURCE_NAMES[e.source] ?? e.source).join(", ")}.`;
  await telegram(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
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
  // Anyone can find the bot, but it only works for its owner.
  if (!msg?.text || String(msg.chat.id) !== chatId) return NextResponse.json({ ok: true });

  const [command, arg] = msg.text.trim().toLowerCase().split(/\s+/);
  const name = command.replace(/@.*$/, ""); // "/scrape@htaFridaybot" in group chats

  if (name === "/scrape") {
    const filter = arg && arg in SOURCE_NAMES ? arg : null;
    await telegram(token, "sendMessage", { chat_id: chatId, text: "⏳ Scraping…" });
    // Answer Telegram right away; scraping takes a while and it retries slow webhooks.
    after(() =>
      scrape(token, chatId, filter).catch((e) =>
        telegram(token, "sendMessage", { chat_id: chatId, text: `❌ Scrape failed: ${e instanceof Error ? e.message : e}` }),
      ),
    );
  } else {
    await telegram(token, "sendMessage", { chat_id: chatId, text: HELP, parse_mode: "HTML" });
  }
  return NextResponse.json({ ok: true });
}
