// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const STATIC_ROOT = join(__dirname, '../../');

// Convert an artishere.org URL back to a local file path
function localPath(url) {
  // e.g. https://artishere.org/images/artwork/foo.jpg -> images/artwork/foo.jpg
  const rel = url.replace('https://artishere.org/', '');
  return join(STATIC_ROOT, rel);
}

async function uploadFile(localFilePath, blobPath) {
  if (!existsSync(localFilePath)) {
    console.warn(`  ⚠ File not found: ${localFilePath}`);
    return null;
  }
  const data = readFileSync(localFilePath);
  const ext = extname(localFilePath).slice(1).toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
  const { url } = await put(blobPath, data, { access: 'public', contentType, addRandomSuffix: false });
  return url;
}

async function main() {
  const artists = await prisma.artist.findMany({
    where: { isPlaceholder: true },
    include: { artworkImages: true },
  });

  console.log(`Processing ${artists.length} placeholder artists...`);

  for (const artist of artists) {
    console.log(`\n${artist.name}`);

    // Upload hero/bio photos on the Artist record
    let heroUrl = artist.heroImageUrl;
    let bioUrl = artist.bioPhotoUrl;

    if (heroUrl?.includes('artishere.org')) {
      const local = localPath(heroUrl);
      const blobPath = `artists/${artist.slug}/hero${extname(local)}`;
      const uploaded = await uploadFile(local, blobPath);
      if (uploaded) { heroUrl = uploaded; console.log(`  ✓ hero → ${uploaded}`); }
    }

    if (bioUrl?.includes('artishere.org')) {
      const local = localPath(bioUrl);
      const blobPath = `artists/${artist.slug}/bio${extname(local)}`;
      const uploaded = await uploadFile(local, blobPath);
      if (uploaded) { bioUrl = uploaded; console.log(`  ✓ bio  → ${uploaded}`); }
    }

    await prisma.artist.update({
      where: { id: artist.id },
      data: { heroImageUrl: heroUrl, bioPhotoUrl: bioUrl },
    });

    // Upload and fix the ArtworkImage record (hero image)
    for (const img of artist.artworkImages) {
      if (img.url?.includes('artishere.org')) {
        const local = localPath(img.url);
        const blobPath = `artists/${artist.slug}/artwork/hero${extname(local)}`;
        const uploaded = await uploadFile(local, blobPath);
        if (uploaded) {
          await prisma.artworkImage.update({ where: { id: img.id }, data: { url: uploaded } });
          console.log(`  ✓ artwork → ${uploaded}`);
        }
      }
    }
  }

  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());