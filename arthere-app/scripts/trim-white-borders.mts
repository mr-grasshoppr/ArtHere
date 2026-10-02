// Re-frame every image that carries a baked-in white border (photographed
// mats, scan margins) so tiles crop to the artwork — see
// REQUIRED-DESIGN-FEATURES.md, "Crop white borders out of artwork tiles", and
// src/lib/image-border.ts for the detection. New uploads get this
// automatically via computeAndStoreFocus; this backfills existing ones.
// Idempotent and safe to re-run. Skips manually framed images (a human's
// framing wins) unless --force is passed.
//
//   npx tsx --tsconfig tsconfig.json scripts/trim-white-borders.mts [--dry] [--force]
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { prisma } = await import("../src/lib/db");
const { detectBorderFocal } = await import("../src/lib/image-border");

const dry = process.argv.includes("--dry");
const force = process.argv.includes("--force");

const [artists, places, focals] = await Promise.all([
  prisma.artist.findMany({ select: { name: true, heroImageUrl: true, bioPhotoUrl: true, artworkImages: { select: { url: true } } } }),
  prisma.place.findMany({ select: { heroImageUrl: true, thumbnailImageUrl: true, galleryImages: true } }),
  prisma.imageFocus.findMany(),
]);
const existing = new Map(focals.map((f) => [f.url, f]));

const urls = new Set<string>();
for (const a of artists) {
  if (a.heroImageUrl) urls.add(a.heroImageUrl);
  if (a.bioPhotoUrl) urls.add(a.bioPhotoUrl);
  a.artworkImages.forEach((i) => urls.add(i.url));
}
for (const p of places) {
  if (p.heroImageUrl) urls.add(p.heroImageUrl);
  if (p.thumbnailImageUrl) urls.add(p.thumbnailImageUrl);
  p.galleryImages.forEach((u) => urls.add(u));
}

let trimmed = 0, skippedManual = 0, failed = 0;
for (const url of urls) {
  const cur = existing.get(url);
  if (cur?.manual && !force) {
    // Only worth mentioning if a border is actually there.
    const would = await detectBorderFocal(url).catch(() => null);
    if (would) { skippedManual++; console.log("manual, skipped:", url, would); }
    continue;
  }
  try {
    const focal = await detectBorderFocal(url, cur ? { x: cur.x, y: cur.y } : undefined);
    if (!focal) continue;
    trimmed++;
    console.log(dry ? "would trim:" : "trimmed:", url, focal);
    if (!dry) {
      await prisma.imageFocus.upsert({
        where: { url },
        create: { url, ...focal },
        update: { ...focal, manual: false },
      });
    }
  } catch (err) {
    failed++;
    console.error("failed:", url, (err as Error).message);
  }
}
console.log({ total: urls.size, trimmed, skippedManual, failed, dry });
await prisma.$disconnect();
