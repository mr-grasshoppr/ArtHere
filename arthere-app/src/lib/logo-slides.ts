import { prisma } from "@/lib/db";
import { getFocalStyles } from "@/lib/image-focus";
import type { LogoSlideData } from "@/components/AnimatedLogoMask";
import type { CSSProperties } from "react";

// Shared by every page that renders <AnimatedLogoMask> so they can't drift
// out of sync on ordering or which focal points get attached.
export async function getLogoSlides(): Promise<{ slides: LogoSlideData[]; focals: Map<string, CSSProperties> }> {
  const rows = await prisma.logoSlide.findMany({ orderBy: { sortOrder: "asc" } });
  const slides = rows.map((r) => ({ id: r.id, imageUrl: r.imageUrl, artistName: r.artistName }));
  const focals = await getFocalStyles(slides.map((s) => s.imageUrl));
  return { slides, focals };
}
