import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { PwaRegister } from "@/components/Pwa";
import { siteUrl } from "@/lib/paths";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Hackathon Hunter",
  description:
    "Find, track and never miss a hackathon deadline. Live listings from Devpost, MLH, Devfolio, DoraHacks, Cerebral Valley, Luma and more, with Myanmar events first.",
  applicationName: "Hackathon Hunter",
  appleWebApp: { capable: true, title: "Hackathons", statusBarStyle: "default" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { siteName: "Hackathon Hunter", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:pt-8">{children}</main>
        <PwaRegister />
      </body>
    </html>
  );
}
