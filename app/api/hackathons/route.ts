import { NextResponse } from "next/server";
import { getHackathons } from "@/lib/aggregate";
import { hasFilters, selectHackathons } from "@/lib/select";

// The merged listings as JSON. Takes the same filters as the Browse page's URL
// (/api/hackathons?mm=1&mode=online), or ids=a,b,c, plus limit=N. Open to other sites (CORS).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const data = await getHackathons();
  const { list, label } = hasFilters(params)
    ? selectHackathons(data.hackathons, params)
    : { list: data.hackathons, label: "All hackathons" };
  const limit = Math.min(1000, Math.max(1, Number(params.get("limit")) || 1000));
  return NextResponse.json(
    { ...data, hackathons: list.slice(0, limit), total: list.length, view: label },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
