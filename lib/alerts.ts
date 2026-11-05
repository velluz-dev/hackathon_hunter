import type { Hackathon } from "./types";

// Telegram alerts for new Myanmar events on Luma, sent by the daily cron. Luma doesn't say when
// an event was posted, so the bot remembers what it has announced in a message pinned in the
// chat: a list of the upcoming Myanmar events on Luma, with links. Anything not on it is new.
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID; without them it does nothing.

export interface AlertResult {
  sent: string[];
  skipped?: string;
}

interface TgMessage {
  message_id: number;
  text?: string;
  from?: { is_bot: boolean };
}

const LUMA_LINK = /https:\/\/lu\.ma\/[^\s<]+/g;

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

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function when(h: Hackathon): string {
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

function announcement(h: Hackathon): string {
  return [
    "🇲🇲 <b>New Myanmar event on Luma</b>",
    "",
    `<b>${escapeHtml(h.title)}</b>`,
    `📅 ${escapeHtml(when(h))} (Yangon time)`,
    `📍 ${escapeHtml(h.location)}`,
    ...(h.organizer ? [`👥 ${escapeHtml(h.organizer)}`] : []),
    "",
    h.url,
  ].join("\n");
}

function pinnedList(events: Hackathon[]): string {
  const lines = events.map((h) => `• <b>${escapeHtml(h.title)}</b> · ${escapeHtml(when(h))}\n${h.url}`);
  return ["📌 <b>Upcoming Myanmar events on Luma</b>", "", ...(lines.length ? lines : ["None right now."])].join("\n");
}

/** Sends a Telegram message for each Myanmar Luma event not announced before, then refreshes the pinned list. */
export async function alertNewMyanmarEvents(hackathons: Hackathon[]): Promise<AlertResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: [], skipped: "not configured" };

  const events = hackathons.filter((h) => h.source === "luma" && h.myanmar);
  const chat = await telegram<{ pinned_message?: TgMessage }>(token, "getChat", { chat_id: chatId });
  const pinned = chat.pinned_message?.from?.is_bot ? chat.pinned_message : undefined;
  const known = new Set(pinned?.text?.match(LUMA_LINK) ?? []);
  const fresh = events.filter((h) => !known.has(h.url));

  for (const h of fresh) {
    await telegram(token, "sendMessage", { chat_id: chatId, text: announcement(h), parse_mode: "HTML" });
  }

  // Rewrite the pinned list when something was added or an event has finished.
  const current = new Set(events.map((h) => h.url));
  const changed = fresh.length > 0 || [...known].some((url) => !current.has(url)) || !pinned;
  if (changed) {
    const text = pinnedList(events);
    const silent = { chat_id: chatId, text, parse_mode: "HTML", disable_notification: true, link_preview_options: { is_disabled: true } };
    if (pinned) {
      await telegram(token, "editMessageText", { ...silent, message_id: pinned.message_id });
    } else {
      const msg = await telegram<TgMessage>(token, "sendMessage", silent);
      await telegram(token, "pinChatMessage", { chat_id: chatId, message_id: msg.message_id, disable_notification: true });
    }
  }
  return { sent: fresh.map((h) => h.title) };
}
