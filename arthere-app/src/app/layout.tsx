import type { Metadata } from "next";
import { Geist, Inter, Nunito, Bebas_Neue } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
// Body copy across the site.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-nunito", display: "swap" });
// Condensed display face — the logo animation's artist-credit label
// (AnimatedLogoMask.module.css) plus the homepage tagline and launch pill.
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas", display: "swap" });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://artishere.org";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Art Here",
    template: "%s",
  },
  description: "Art Here puts local artists on the map.",
  openGraph: {
    title: "Art Here",
    description: "Art Here puts local artists on the map.",
    url: BASE_URL,
    siteName: "Art Here",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable} ${nunito.variable} ${bebasNeue.variable} h-full antialiased`}>
      {/* The site is light-only — every page sets its own colors on top of
          this neutral base. */}
      <body className="min-h-full bg-white text-[#1a1a1a] font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
