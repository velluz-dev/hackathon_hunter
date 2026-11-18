// The Hackathon Hunter mark drawn with plain boxes, for next/og images (app icons). Matches
// LogoMark in components/icons.tsx: an indigo tile, a white crosshair ring and an amber dot.
// `inset` shrinks the mark inside the tile, for "maskable" icons that phones crop to a circle.
export function logoElement(size: number, inset = 0) {
  const tile = size * (1 - inset * 2);
  const ring = tile * 0.53;
  const stroke = Math.max(2, tile * 0.069);
  const tick = tile * 0.16;
  const dot = tile * 0.15;
  const c = size / 2;
  const line = (style: Record<string, number | string>) => (
    <div style={{ position: "absolute", background: "white", borderRadius: stroke, ...style }} />
  );
  return (
    <div style={{ width: size, height: size, display: "flex", background: inset ? "#4f46e5" : "transparent", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: (size - tile) / 2,
          top: (size - tile) / 2,
          width: tile,
          height: tile,
          borderRadius: inset ? 0 : tile * 0.28,
          background: "#4f46e5",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: c - ring / 2,
          top: c - ring / 2,
          width: ring,
          height: ring,
          borderRadius: ring,
          border: `${stroke}px solid white`,
          display: "flex",
        }}
      />
      {line({ left: c - stroke / 2, top: c - tile * 0.36, width: stroke, height: tick })}
      {line({ left: c - stroke / 2, top: c + tile * 0.2, width: stroke, height: tick })}
      {line({ top: c - stroke / 2, left: c - tile * 0.36, height: stroke, width: tick })}
      {line({ top: c - stroke / 2, left: c + tile * 0.2, height: stroke, width: tick })}
      <div style={{ position: "absolute", left: c - dot / 2, top: c - dot / 2, width: dot, height: dot, borderRadius: dot, background: "#fcd34d" }} />
    </div>
  );
}
