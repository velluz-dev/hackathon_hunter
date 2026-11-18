import { ImageResponse } from "next/og";
import { logoElement } from "@/lib/logoImage";

// App icons for the web app manifest: /pwa-icon/192, /pwa-icon/512 and /pwa-icon/maskable.
const SIZES: Record<string, { px: number; inset: number }> = {
  "192": { px: 192, inset: 0 },
  "512": { px: 512, inset: 0 },
  maskable: { px: 512, inset: 0.1 },
};

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const spec = SIZES[(await params).size];
  if (!spec) return new Response("Not found", { status: 404 });
  return new ImageResponse(logoElement(spec.px, spec.inset), {
    width: spec.px,
    height: spec.px,
    headers: { "Cache-Control": "public, max-age=604800, immutable" },
  });
}
