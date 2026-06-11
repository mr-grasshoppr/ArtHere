// Uploads hero photos for the Community places that have one available in
// the static prototype's /images/places folder, and sets Place.heroImageUrl
// so they show up as photos (not just colored squares) on the Network page
// and Community cards.
//
// Source images come from js/places.js in the static site:
//   nw-marine-art-works   -> images/places/nwmarine-header.jpg
//   multnomah-arts-center -> images/places/multnomah.jpg
//   comeunity-pdx         -> images/places/communitypdx.jpg
//   alberta-street-gallery-> images/places/alberta-street-gallery-hero.jpg
//
// portland-art-studios has no image in the static site (image: null) and is
// left as-is.
//
// Usage:
//   node scripts/seed-place-photos.mjs
//   node scripts/seed-place-photos.mjs --dry-run

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const staticRoot = path.resolve(projectRoot, "..");
const DRY_RUN = process.argv.includes("--dry-run");

function loadEnvFile(filePath, { force = false } = {}) {
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (force || !(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(projectRoot, ".env.local"), { force: true });
loadEnvFile(path.join(projectRoot, ".env"));

const hasRwToken =
  Boolean(process.env.BLOB_READ_WRITE_TOKEN) &&
  process.env.BLOB_READ_WRITE_TOKEN !== "vercel_blob_stub";
const hasOidc = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);

if (!DRY_RUN && !hasRwToken && !hasOidc) {
  console.error(
    "✗ No usable Blob credentials found (need BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN+BLOB_STORE_ID)."
  );
  process.exit(1);
}

const prisma = DRY_RUN ? null : new PrismaClient();

const PHOTOS = {
  "nw-marine-art-works": "images/places/nwmarine-header.jpg",
  "multnomah-arts-center": "images/places/multnomah.jpg",
  "comeunity-pdx": "images/places/communitypdx.jpg",
  "alberta-street-gallery": "images/places/alberta-street-gallery-hero.jpg",
};

async function uploadImage(relativeSrc, blobFolder) {
  const localPath = path.resolve(staticRoot, relativeSrc);
  if (!existsSync(localPath)) {
    console.warn(`    ! image not found on disk: ${localPath}`);
    return null;
  }

  if (DRY_RUN) {
    return `(dry-run) blob://${blobFolder}/${path.basename(localPath)}`;
  }

  const buffer = readFileSync(localPath);
  const filename = `${blobFolder}/${path.basename(localPath)}`;
  const blob = await put(filename, buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    ...(hasRwToken && !hasOidc ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
  });
  return blob.url;
}

async function main() {
  console.log(`Seeding place photos${DRY_RUN ? " [DRY RUN]" : ""}...`);

  for (const [slug, relativeSrc] of Object.entries(PHOTOS)) {
    console.log(`\n${slug}:`);

    if (DRY_RUN) {
      console.log(`  would upload ${relativeSrc} -> places/${slug}/ and set heroImageUrl`);
      continue;
    }

    const place = await prisma.place.findUnique({ where: { slug } });
    if (!place) {
      console.warn(`  ! No place found with slug "${slug}", skipping`);
      continue;
    }

    const url = await uploadImage(relativeSrc, `places/${slug}`);
    if (!url) continue;

    await prisma.place.update({ where: { slug }, data: { heroImageUrl: url } });
    console.log(`  ✓ ${place.name} -> ${url}`);
  }

  if (!DRY_RUN) await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
