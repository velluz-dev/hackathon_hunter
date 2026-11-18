import { getHackathons } from "@/lib/aggregate";
import { buildCalendar } from "@/lib/feeds";
import { siteUrl } from "@/lib/paths";
import { selectHackathons } from "@/lib/select";

// A calendar subscription for any view: /api/calendar?mm=1 for Myanmar events,
// /api/calendar?ids=devpost:1,luma:evt-2 for a saved list. Google, Apple and Outlook calendars
// re-download it every few hours, so new hackathons and changed dates show up on their own.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const { hackathons } = await getHackathons();
  const { list, label } = selectHackathons(hackathons, params);
  const ics = buildCalendar(`Hackathons: ${label}`, list.slice(0, 400), siteUrl());
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="hackathons.ics"',
      "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
