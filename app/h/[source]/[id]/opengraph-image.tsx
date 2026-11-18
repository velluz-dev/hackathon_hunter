import { ImageResponse } from "next/og";
import { getHackathons } from "@/lib/aggregate";
import { idFromParams } from "@/lib/paths";
import { isSource, sourceName } from "@/lib/sources/meta";
import { compactUsd, formatInZone, isDateOnly, YANGON } from "@/lib/when";

// The preview picture Telegram, Facebook and X show when a hackathon's page is shared.
export const alt = "Hackathon details on Hackathon Hunter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ source: string; id: string }> }) {
  const { source, id } = await params;
  const h = isSource(source) ? (await getHackathons()).hackathons.find((x) => x.id === idFromParams(source, id)) : undefined;
  const title = h?.title ?? "Hackathon Hunter";
  const facts = h
    ? [
        h.startDate ? formatInZone(h.startDate, YANGON, isDateOnly(h)) : "Dates TBA",
        h.mode === "online" ? "Online" : h.location.length > 48 ? `${h.location.slice(0, 46)}…` : h.location,
        h.prizeUsd ? `${compactUsd(h.prizeUsd)} in prizes` : null,
        ...h.companies.slice(0, 2),
      ].filter((f): f is string => Boolean(f))
    : ["Find, track and never miss a hackathon deadline"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, opacity: 0.92 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "white",
              color: "#4338ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              marginRight: 18,
            }}
          >
            H
          </div>
          {h ? `Hackathon Hunter · ${sourceName(h.source)}` : "Hackathon Hunter"}
        </div>
        <div style={{ display: "flex", fontSize: title.length > 70 ? 52 : title.length > 40 ? 64 : 76, lineHeight: 1.1 }}>{title}</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {h?.deadline && h.deadlineLabel !== "Starts" && (
            <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "#fbbf24", color: "#1e1b4b", fontSize: 28, marginRight: 14, marginBottom: 14 }}>
              {`${h.deadlineLabel} ${formatInZone(h.deadline, YANGON, isDateOnly(h)).replace(/,? \d{4}/, "")}`}
            </div>
          )}
          {facts.map((f) => (
            <div key={f} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.16)", fontSize: 28, marginRight: 14, marginBottom: 14 }}>
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
