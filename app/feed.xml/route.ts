import { getHackathons } from "@/lib/aggregate";
import { buildRss } from "@/lib/feeds";
import { siteUrl } from "@/lib/paths";
import { selectHackathons } from "@/lib/select";

// RSS for any view, e.g. /feed.xml?mm=1. Works with feed readers and Telegram or Discord RSS bots.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const { hackathons } = await getHackathons();
  const { list, label } = selectHackathons(hackathons, url.searchParams);
  const base = siteUrl();
  const rss = buildRss(`Hackathon Hunter: ${label}`, `${base}${url.pathname}${url.search}`, list.slice(0, 200), base);
  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
