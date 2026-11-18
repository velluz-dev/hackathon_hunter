import * as cheerio from "cheerio";
import { htmlToText, parsePost } from "../postParse";
import { safeUrl } from "../safeUrl";
import { plainText } from "../text";
import type { RawHackathon } from "../types";

// Facebook doesn't let apps read pages' posts, but feed services such as rss.app and FetchRSS
// turn a public Facebook page into an RSS feed. Put those feed links in the FACEBOOK_FEEDS
// environment variable (separated by commas, spaces or new lines) and the hackathon posts on
// them are listed here. This code only reads the feeds; it never visits Facebook itself.
// The pages are taken to be Myanmar pages: a post that names no other place counts as Myanmar.

const DAY = 86_400_000;
const MAX_AGE = 60 * DAY; // posts older than this are ignored
const UNDATED_MAX_AGE = 21 * DAY; // a post without any date is listed for this long

/** Feed links kept in code, on top of FACEBOOK_FEEDS. Handy for pages everyone should see. */
const FEEDS_IN_CODE: string[] = [
  // "https://rss.app/feeds/XXXXXXXXXXXXXXXX.xml", // FOSS Myanmar
];

export function facebookFeeds(): string[] {
  const fromEnv = (process.env.FACEBOOK_FEEDS ?? "").split(/[\s,]+/).filter(Boolean);
  return [...new Set([...fromEnv, ...FEEDS_IN_CODE].map((u) => u.trim()))].filter((u) => /^https:\/\//i.test(u));
}

interface FeedItem {
  title: string;
  link: string;
  html: string;
  postedAt: number | null;
  image: string | null;
}

interface Feed {
  name: string | null;
  items: FeedItem[];
}

const time = (s: string | undefined) => {
  const t = s ? Date.parse(s.trim()) : NaN;
  return Number.isNaN(t) ? null : t;
};

/** RSS 2.0, Atom or JSON Feed, whichever the service sends. */
export function parseFeed(body: string): Feed {
  const text = body.trim();
  if (text.startsWith("{")) {
    const j = JSON.parse(text) as {
      title?: string;
      items?: { url?: string; title?: string; content_html?: string; content_text?: string; summary?: string; date_published?: string; image?: string }[];
    };
    return {
      name: j.title ?? null,
      items: (j.items ?? []).map((i) => ({
        title: i.title ?? "",
        link: i.url ?? "",
        html: i.content_html ?? i.content_text ?? i.summary ?? "",
        postedAt: time(i.date_published),
        image: i.image ?? null,
      })),
    };
  }
  const $ = cheerio.load(text, { xml: true });
  if ($("rss, channel").length) {
    return {
      name: $("channel > title").first().text().trim() || null,
      items: $("item")
        .toArray()
        .map((el) => {
          const e = $(el);
          return {
            title: e.children("title").first().text(),
            link: e.children("link").first().text().trim() || e.children("guid").first().text().trim(),
            html: e.find("content\\:encoded").first().text() || e.children("description").first().text(),
            postedAt: time(e.children("pubDate").first().text() || e.find("dc\\:date").first().text()),
            image: e.find("media\\:content").first().attr("url") ?? e.children("enclosure").first().attr("url") ?? null,
          };
        }),
    };
  }
  return {
    name: $("feed > title").first().text().trim() || null,
    items: $("entry")
      .toArray()
      .map((el) => {
        const e = $(el);
        return {
          title: e.children("title").first().text(),
          link: e.children("link[rel='alternate']").attr("href") ?? e.children("link").first().attr("href") ?? "",
          html: e.children("content").first().text() || e.children("summary").first().text(),
          postedAt: time(e.children("published").first().text() || e.children("updated").first().text()),
          image: e.find("media\\:content, media\\:thumbnail").first().attr("url") ?? null,
        };
      }),
  };
}

/** Short stable id for a post link. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

// "FOSS Myanmar - Facebook", "FOSS Myanmar | Facebook" -> "FOSS Myanmar"
const pageName = (name: string | null) => name?.replace(/\s*[-|·]\s*facebook\s*$/i, "").trim() || null;

export function toListing(item: FeedItem, page: string | null, now: number): RawHackathon | null {
  const body = htmlToText(item.html).replace(/\(Feed generated with FetchRSS\)/gi, "").trim();
  const title = item.title.trim();
  // Feed titles are usually the post's first words; keep them only when the body doesn't start with them.
  const text = [title && !body.startsWith(title.replace(/[.…]+$/, "").slice(0, 30)) ? title : "", body].filter(Boolean).join("\n");
  const posted = item.postedAt ?? now;
  if (now - posted > MAX_AGE) return null;
  const p = parsePost(text, posted);
  if (!p.isHackathon) return null;
  const dates = [p.endDate, p.startDate, p.deadline].filter((d): d is string => !!d).map(Date.parse);
  if (dates.length ? Math.max(...dates) < now : now - posted > UNDATED_MAX_AGE) return null;
  const url = safeUrl(item.link) ?? safeUrl(p.url);
  if (!url) return null;
  const location =
    p.mode === "online" ? (/myanmar/i.test(p.location ?? "") ? p.location! : "Online · Myanmar") : (p.location ?? "Myanmar");
  return {
    id: `facebook:${hash(url)}`,
    source: "facebook",
    title: p.title ?? plainText(text, 90) ?? "Facebook post",
    url,
    image: safeUrl(item.image) ?? safeUrl(item.html.match(/<img[^>]+src="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&")),
    startDate: p.startDate,
    endDate: p.endDate,
    deadline: p.deadline,
    deadlineLabel: p.deadlineLabel,
    location,
    mode: p.mode ?? "in-person",
    prizeUsd: p.prizeUsd,
    themes: ["Facebook post"],
    participants: null,
    organizer: page,
    description: plainText(text, 700),
  };
}

export async function fetchFacebook(): Promise<RawHackathon[]> {
  const feeds = facebookFeeds();
  if (feeds.length === 0) return [];
  const now = Date.now();
  const results = await Promise.allSettled(
    feeds.map(async (url) => {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (HackathonHunter)",
          Accept: "application/rss+xml, application/atom+xml, application/feed+json, application/xml;q=0.9, */*;q=0.8",
        },
        next: { revalidate: 1800 },
      });
      if (!res.ok) throw new Error(`feed responded ${res.status}`);
      return parseFeed(await res.text());
    }),
  );
  const loaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (loaded.length === 0) {
    const reason = results[0]?.status === "rejected" ? String((results[0] as PromiseRejectedResult).reason?.message ?? "") : "";
    throw new Error(`Couldn't read the Facebook feed${feeds.length > 1 ? "s" : ""}${reason ? ` (${reason})` : ""}`);
  }
  const seen = new Set<string>();
  return loaded
    .flatMap((feed) => feed.items.map((item) => toListing(item, pageName(feed.name), now)))
    .filter((h): h is RawHackathon => {
      if (!h || seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });
}
