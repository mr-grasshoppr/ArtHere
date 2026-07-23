// Uploads 3 gallery photos for each Community place that has them in the
// static prototype, and sets Place.galleryImages so they show up at the
// bottom of the place's page (matching the static site's layout).
//
// Sources:
//   alberta-street-gallery   -> images/places/alberta-street-gallery-{1,2,3}.jpg
//   nw-marine-art-works      -> images/places/{nwmarine-mural1,nwmarine-interior,nwmarine-header}.jpg
//   comeunity-pdx            -> base64 images embedded in places/comeunity-pdx.html
//   multnomah-arts-center    -> base64 images embedded in places/multnomah-arts-center.html
//
// Usage:
//   node scripts/seed-place-gallery.mjs
//   node scripts/seed-place-gallery.mjs --dry-run

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

// Pull the 3 base64-embedded <img> sources out of a static place page's
// <div class="place-gallery">...</div> block, in document order.
function extractInlineGalleryImages(htmlRelativePath) {
  const htmlPath = path.resolve(staticRoot, htmlRelativePath);
  const html = readFileSync(htmlPath, "utf-8");
  const galleryMatch = html.match(/<div class="place-gallery">([\s\S]*?)<\/div>/);
  if (!galleryMatch) return [];
  const imgRe = /<img src="data:([^;]+);base64,([^"]+)"/g;
  const images = [];
  let m;
  while ((m = imgRe.exec(galleryMatch[1]))) {
    const [, mime, data] = m;
    const ext = mime === "image/png" ? "png" : "jpg";
    images.push({ buffer: Buffer.from(data, "base64"), ext });
  }
  return images;
}

const PLACES = {
  "alberta-street-gallery": {
    files: [
      "images/places/alberta-street-gallery-1.jpg",
      "images/places/alberta-street-gallery-2.jpg",
      "images/places/alberta-street-gallery-3.jpg",
    ],
  },
  "nw-marine-art-works": {
    files: [
      "images/places/nwmarine-mural1.jpg",
      "images/places/nwmarine-interior.jpg",
      "images/places/nwmarine-header.jpg",
    ],
  },
  "comeunity-pdx": {
    inlineFrom: "places/comeunity-pdx.html",
  },
  "multnomah-arts-center": {
    inlineFrom: "places/multnomah-arts-center.html",
  },
};

async function uploadBuffer(buffer, blobPath) {
  if (DRY_RUN) return `(dry-run) blob://${blobPath}`;
  const blob = await put(blobPath, buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/jpeg",
    ...(hasRwToken && !hasOidc ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
  });
  return blob.url;
}

async function main() {
  console.log(`Seeding place galleries${DRY_RUN ? " [DRY RUN]" : ""}...`);

  for (const [slug, config] of Object.entries(PLACES)) {
    console.log(`\n${slug}:`);

    let images;
    if (config.files) {
      images = config.files
        .map(relativeSrc => {
          const localPath = path.resolve(staticRoot, relativeSrc);
          if (!existsSync(localPath)) {
            console.warn(`    ! image not found on disk: ${localPath}`);
            return null;
          }
          return { buffer: readFileSync(localPath), ext: path.extname(localPath).slice(1) || "jpg" };
        })
        .filter(Boolean);
    } else {
      images = extractInlineGalleryImages(config.inlineFrom);
      console.log(`  extracted ${images.length} inline image(s) from ${config.inlineFrom}`);
    }

    if (images.length === 0) {
      console.warn(`  ! no gallery images found, skipping`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  would upload ${images.length} image(s) -> places/${slug}/gallery-N.<ext> and set galleryImages`);
      continue;
    }

    const place = await prisma.place.findUnique({ where: { slug } });
    if (!place) {
      console.warn(`  ! No place found with slug "${slug}", skipping`);
      continue;
    }

    const urls = [];
    for (let i = 0; i < images.length; i++) {
      const { buffer, ext } = images[i];
      const url = await uploadBuffer(buffer, `places/${slug}/gallery-${i + 1}.${ext}`);
      urls.push(url);
    }

    await prisma.place.update({ where: { slug }, data: { galleryImages: urls } });
    console.log(`  ✓ ${place.name} -> ${urls.length} gallery image(s)`);
    for (const url of urls) console.log(`      ${url}`);
  }

  if (!DRY_RUN) await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
