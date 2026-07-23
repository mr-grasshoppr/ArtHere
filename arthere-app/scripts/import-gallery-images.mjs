/**
 * One-time script: for each placeholder artist, find their gallery images in the
 * original static-site HTML, upload them to Vercel Blob, and create ArtworkImage
 * records.  Run from the arthere-app/ directory:
 *
 *   node scripts/import-gallery-images.mjs
 *
 * Safe to re-run: skips images already in blob (addRandomSuffix: false) and
 * skips ArtworkImage records whose URL already points to that blob path.
 */

import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, '../../');          // ArtHere/
const ARTISTS_DIR = join(REPO_ROOT, 'artists');        // ArtHere/artists/*.html
const prisma = new PrismaClient();

async function uploadFile(localPath, blobPath) {
  if (!existsSync(localPath)) {
    console.warn(`    ⚠ not found: ${localPath}`);
    return null;
  }
  const data = readFileSync(localPath);
  const ext  = extname(localPath).slice(1).toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
  const { url } = await put(blobPath, data, { access: 'public', contentType, addRandomSuffix: false });
  return url;
}

/** Extract all <img> srcs from .art-cell divs in an HTML string. */
function extractGalleryImages(html) {
  const srcs = [];
  const re = /class="art-cell"[^>]*>\s*<img[^>]+src="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) srcs.push(m[1]);
  return srcs;
}

async function main() {
  const artists = await prisma.artist.findMany({
    where: { isPlaceholder: true },
    include: { artworkImages: true },
    orderBy: { name: 'asc' },
  });

  console.log(`Processing ${artists.length} placeholder artists...\n`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const artist of artists) {
    const htmlPath = join(ARTISTS_DIR, `${artist.slug}.html`);
    if (!existsSync(htmlPath)) {
      console.log(`${artist.name}: no HTML file, skipping`);
      continue;
    }

    const html = readFileSync(htmlPath, 'utf8');
    const gallerySrcs = extractGalleryImages(html);

    if (gallerySrcs.length === 0) {
      console.log(`${artist.name}: no gallery images in HTML`);
      continue;
    }

    console.log(`${artist.name} (${gallerySrcs.length} gallery imgs)`);

    for (let i = 0; i < gallerySrcs.length; i++) {
      // src is like '../images/artwork/benjamin-posin-1.jpg'
      const rel      = gallerySrcs[i].replace(/^\.\.\//, '');
      const localPath = join(REPO_ROOT, rel);
      const filename  = rel.split('/').pop();           // e.g. benjamin-posin-1.jpg
      const blobPath  = `artists/${artist.slug}/artwork/${filename}`;
      const blobUrl   = `https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/${blobPath}`;

      // Skip if an ArtworkImage record already points to this blob URL
      if (artist.artworkImages.some(img => img.url === blobUrl)) {
        console.log(`  ✓ ${filename} (already exists)`);
        totalSkipped++;
        continue;
      }

      const uploaded = await uploadFile(localPath, blobPath);
      if (!uploaded) continue;

      await prisma.artworkImage.create({
        data: {
          artistId: artist.id,
          url:      uploaded,
          isHero:   false,
          sortOrder: i + 1,   // hero image (created earlier) is sortOrder 0
          altText:  null,
        },
      });

      console.log(`  ✓ ${filename} → ${uploaded}`);
      totalCreated++;
    }
  }

  console.log(`\nDone: ${totalCreated} created, ${totalSkipped} skipped.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
