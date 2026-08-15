import { prisma } from "@/lib/db";
import { getFocalStyles } from "@/lib/image-focus";
import type { LogoSlideData } from "@/components/AnimatedLogoMask";
import type { CSSProperties } from "react";

// Shared by every page that renders <AnimatedLogoMask> so they can't drift
// out of sync on ordering or which focal points get attached. These pages
// (/, /login, /survey) aren't behind generateStaticParams, so they can't use
// safeStaticParams — same "unreachable DB in CI/preview builds shouldn't
// fail the build" guarantee, applied at the page-body level instead: an
// unreachable DB degrades to zero logo slides rather than crashing.
export async function getLogoSlides(): Promise<{ slides: LogoSlideData[]; focals: Map<string, CSSProperties> }> {
  try {
    const rows = await prisma.logoSlide.findMany({ orderBy: { sortOrder: "asc" } });
    const slides = rows.map((r) => ({ id: r.id, imageUrl: r.imageUrl, artistName: r.artistName }));
    const focals = await getFocalStyles(slides.map((s) => s.imageUrl));
    return { slides, focals };
  } catch (err) {
    console.warn("getLogoSlides: database unavailable, rendering without slides.", err instanceof Error ? err.message : err);
    return { slides: [], focals: new Map() };
  }
}
