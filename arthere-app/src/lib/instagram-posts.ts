import { prisma } from "@/lib/db";
import type { InstagramPost } from "@/components/InstagramPostsRow";

/**
 * Tiles for the homepage Instagram carousel, curated via /admin/instagram.
 *
 * Same "an unreachable DB shouldn't fail the build" guarantee as
 * getLogoSlides: the homepage isn't behind generateStaticParams, so it can't
 * use safeStaticParams, and degrades to an empty carousel (which renders
 * nothing at all) rather than crashing.
 */
export async function getInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const rows = await prisma.instagramPost.findMany({ orderBy: { sortOrder: "asc" } });
    return rows
      // A row with no image yet (just added in the admin) would render an
      // empty tile on the live site, so skip it until it has one.
      .filter((r) => r.imageUrl)
      .map((r) => ({
        imageUrl: r.imageUrl,
        alt: r.alt,
        permalink: r.permalink || undefined,
      }));
  } catch (err) {
    console.warn(
      "getInstagramPosts: database unavailable, rendering without the carousel.",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}
