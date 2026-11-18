import { ImageResponse } from "next/og";
import { logoElement } from "@/lib/logoImage";

// Home screen icon for iPhone and iPad ("Add to Home Screen").
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(logoElement(180, 0.08), size);
}
