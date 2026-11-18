import type { MetadataRoute } from "next";

// Makes the site installable ("Add to Home screen" / "Install app"), opening without browser bars.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hackathon Hunter",
    short_name: "Hackathons",
    description: "Find, track and never miss a hackathon deadline. Myanmar events first.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#4f46e5",
    categories: ["education", "productivity"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Lets the installed app appear in the phone's share sheet: sharing a Facebook post to it
    // opens Saved with the post filled into "Add from link".
    share_target: {
      action: "/saved",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
    shortcuts: [
      { name: "Myanmar events", short_name: "Myanmar", url: "/?mm=1" },
      { name: "Closing this week", short_name: "Closing", url: "/?closing=1" },
      { name: "Saved", url: "/saved" },
    ],
  };
}
