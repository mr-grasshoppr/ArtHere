import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { computeAndStoreFocus } from "@/lib/image-focus";

export const maxDuration = 60;

// Admin-triggered backfill of image focal points, in batches so it fits inside
// the function timeout. Returns how many were processed and how many remain;
// the admin UI calls it repeatedly until remaining hits 0. Idempotent — already
// analyzed images are skipped by computeAndStoreFocus.
const BATCH = 12;

export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gather every image URL in use.
  const [artists, places, done] = await Promise.all([
    prisma.artist.findMany({ select: { heroImageUrl: true, bioPhotoUrl: true, artworkImages: { select: { url: true } } } }),
    prisma.place.findMany({ select: { heroImageUrl: true, thumbnailImageUrl: true, galleryImages: true } }),
    prisma.imageFocus.findMany({ select: { url: true } }),
  ]);

  const all = new Set<string>();
  for (const a of artists) {
    if (a.heroImageUrl) all.add(a.heroImageUrl);
    if (a.bioPhotoUrl) all.add(a.bioPhotoUrl);
    a.artworkImages.forEach((i) => all.add(i.url));
  }
  for (const p of places) {
    if (p.heroImageUrl) all.add(p.heroImageUrl);
    if (p.thumbnailImageUrl) all.add(p.thumbnailImageUrl);
    p.galleryImages.forEach((u) => all.add(u));
  }

  const analyzed = new Set(done.map((r) => r.url));
  const todo = [...all].filter((u) => !analyzed.has(u));
  const batch = todo.slice(0, BATCH);

  await Promise.all(batch.map((url) => computeAndStoreFocus(url)));

  return NextResponse.json({
    total: all.size,
    processedThisCall: batch.length,
    remaining: Math.max(0, todo.length - batch.length),
  });
}
