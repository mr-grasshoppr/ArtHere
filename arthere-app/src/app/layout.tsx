import type { Metadata } from "next";
import { Geist, Nunito } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const nunito = Nunito({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "Art Here Portland",
  description: "Discover Portland artists — search by medium, style, color, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-[family-name:var(--font-geist)]">
        {children}
      </body>
    </html>
  );
}
