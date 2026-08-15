"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// Marks a manual audit pass as done for these images — distinct from
// aiTaggedAt (the AI ran) or medium being set (a tag exists). This is
// specifically "a human looked at this and confirmed/fixed the tags."
export async function setImagesReviewed(imageIds: string[], reviewed: boolean) {
  await requireAdmin();
  if (imageIds.length === 0) return;
  await prisma.artworkImage.updateMany({
    where: { id: { in: imageIds } },
    data: { tagsReviewedAt: reviewed ? new Date() : null },
  });
  revalidatePath("/admin/artwork-review");
}

// Hides an image from the review grid entirely (e.g. a hero shot of a
// storefront isn't really "artwork" to tag) — doesn't touch the public site.
export async function setImagesExcluded(imageIds: string[], excluded: boolean) {
  await requireAdmin();
  if (imageIds.length === 0) return;
  await prisma.artworkImage.updateMany({
    where: { id: { in: imageIds } },
    data: { excludedFromReviewAt: excluded ? new Date() : null },
  });
  revalidatePath("/admin/artwork-review");
}

// Hides an image from the PUBLIC browse grids (city artwork page, city
// ambient background) — unlike setImagesExcluded, this does affect the
// public site, so it also revalidates the affected cities' pages. The
// image stays visible on the artist's own profile page and is still
// editable here; this only pulls it out of the grids.
export async function setImagesExcludedFromGrid(imageIds: string[], excluded: boolean) {
  await requireAdmin();
  if (imageIds.length === 0) return;

  const affected = await prisma.artworkImage.findMany({
    where: { id: { in: imageIds } },
    select: { artist: { select: { city: { select: { slug: true } } } } },
  });

  await prisma.artworkImage.updateMany({
    where: { id: { in: imageIds } },
    data: { excludedFromGridAt: excluded ? new Date() : null },
  });

  revalidatePath("/admin/artwork-review");
  const citySlugs = new Set(affected.map((img) => img.artist.city?.slug).filter((s): s is string => !!s));
  for (const slug of citySlugs) {
    revalidatePath(`/cities/${slug}`);
    revalidatePath(`/cities/${slug}/artwork`);
  }
}
