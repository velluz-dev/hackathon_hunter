import { pageUrl } from "./feeds";
import { siteUrl } from "./paths";
import { sourceName } from "./sources/meta";
import type { Hackathon } from "./types";

// Telegram alerts for new Myanmar events from every source, sent by the daily cron. No source
// says when an event was posted, so the bot remembers what it has announced in a message
// pinned in the chat: a list of the upcoming Myanmar events, each title linking to the event.
// Anything not on it is new. Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID; without them it
// does nothing.

export interface AlertResult {
  sent: string[];
  skipped?: string;
}

interface TgMessage {
  message_id: number;
  text?: string;
  from?: { is_bot: boolean };
  /** Titles in the pinned list are text links; their URLs come back here, not in `text`. */
  entities?: { type: string; url?: string }[];
}

const LINK = /https?:\/\/[^\s<>"]+/g;
// The pinned list before it covered every source; only Luma events were announced then.
const OLD_LUMA_ONLY_HEADER = "Upcoming Myanmar events on Luma";
const PINNED_HEADER = "📌 <b>Upcoming Myanmar events</b>";
const MAX_TEXT = 3900; // Telegram allows 4096 characters

export async function telegram<T>(token: string, method: string, body: object): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description ?? res.status}`);
  return data.result;
}

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function when(h: Pick<Hackathon, "startDate">): string {
  if (!h.startDate) return "Dates TBA";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Yangon",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(h.startDate));
}

/** An `<a>` for Telegram's HTML mode. */
export const link = (url: string, text: string) => `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>`;

function announcement(h: Hackathon): string {
  const page = pageUrl(h, siteUrl());
  return [
    `🇲🇲 <b>New Myanmar event</b> · ${escapeHtml(sourceName(h.source))}`,
    "",
    `<b>${escapeHtml(h.title)}</b>`,
    `📅 ${escapeHtml(when(h))} (Yangon time)`,
    ...(h.deadline && h.deadlineLabel !== "Starts" ? [`⏳ ${escapeHtml(h.deadlineLabel)}: ${escapeHtml(when({ startDate: h.deadline }))}`] : []),
    `📍 ${escapeHtml(h.location)}`,
    ...(h.organizer ? [`👥 ${escapeHtml(h.organizer)}`] : []),
    "",
    h.url,
    ...(page !== h.url ? [`Details & reminders: ${page}`] : []),
  ].join("\n");
}

/** Each title links to its event; the links are what the bot reads back to know what it announced. */
function pinnedList(events: Hackathon[]): string {
  const full = events.map((h) => `• ${link(h.url, h.title)} · ${escapeHtml(when(h))}`);
  const short = events.map((h) => `• ${link(h.url, h.title.length > 40 ? `${h.title.slice(0, 38)}…` : h.title)}`);
  const visible = (lines: string[]) => [PINNED_HEADER, "", ...lines].join("\n").replace(/<[^>]+>/g, "").length;
  const lines = !events.length ? ["None right now."] : visible(full) <= MAX_TEXT ? full : short;
  return [PINNED_HEADER, "", ...lines].join("\n");
}

// Telegram may hand a link back with or without its trailing slash.
const norm = (url: string) => url.replace(/\/+$/, "").toLowerCase();

/** Every event URL the pinned list mentions, as raw text (old format) or as title links. */
function knownUrls(pinned?: TgMessage): Set<string> {
  const urls = [...(pinned?.text?.match(LINK) ?? []), ...(pinned?.entities ?? []).flatMap((e) => (e.type === "text_link" && e.url ? [e.url] : []))];
  return new Set(urls.map(norm));
}

/** Sends a Telegram message for each Myanmar event not announced before, then refreshes the pinned list. */
export async function alertNewMyanmarEvents(hackathons: Hackathon[]): Promise<AlertResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: [], skipped: "not configured" };

  const events = hackathons.filter((h) => h.myanmar);
  const chat = await telegram<{ pinned_message?: TgMessage }>(token, "getChat", { chat_id: chatId });
  const pinned = chat.pinned_message?.from?.is_bot ? chat.pinned_message : undefined;
  const known = knownUrls(pinned);
  // Upgrading from the Luma-only list: the other sources' events were never announced, but
  // they aren't news either, so they're added to the list quietly instead of all at once.
  const upgrading = !!pinned?.text?.includes(OLD_LUMA_ONLY_HEADER);
  const fresh = events.filter((h) => !known.has(norm(h.url)) && (!upgrading || h.source === "luma"));

  for (const h of fresh) {
    await telegram(token, "sendMessage", { chat_id: chatId, text: announcement(h), parse_mode: "HTML" });
  }

  // Rewrite the pinned list when something was added or an event has finished.
  const current = new Set(events.map((h) => norm(h.url)));
  const changed = fresh.length > 0 || upgrading || [...known].some((url) => !current.has(url)) || events.some((h) => !known.has(norm(h.url))) || !pinned;
  if (changed) {
    const text = pinnedList(events);
    const silent = { chat_id: chatId, text, parse_mode: "HTML", disable_notification: true, link_preview_options: { is_disabled: true } };
    if (pinned) {
      await telegram(token, "editMessageText", { ...silent, message_id: pinned.message_id }).catch((e: unknown) => {
        // Same list as before (only a link's spelling changed): nothing to update.
        if (!(e instanceof Error && /not modified/i.test(e.message))) throw e;
      });
    } else {
      const msg = await telegram<TgMessage>(token, "sendMessage", silent);
      await telegram(token, "pinChatMessage", { chat_id: chatId, message_id: msg.message_id, disable_notification: true });
    }
  }
  return { sent: fresh.map((h) => h.title) };
}
