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
