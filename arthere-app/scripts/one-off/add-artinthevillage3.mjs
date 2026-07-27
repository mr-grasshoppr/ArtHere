// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

import sharp from 'sharp';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  const raw = await readFile(path.join(__dirname, '../src/app/admin/places/ArtintheVillage/ArtintheVillage3.png'));
  const buf = await sharp(raw).webp({ quality: 90 }).toBuffer();

  console.log(`Uploading mural3.webp (${buf.byteLength} bytes)…`);
  const { url } = await put('places/art-in-the-village/mural3.webp', buf, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'image/webp',
  });
  console.log('→', url);

  const place = await prisma.place.findUnique({ where: { slug: 'art-in-the-village' } });
  if (!place) throw new Error('Place not found');

  await prisma.place.update({
    where: { slug: 'art-in-the-village' },
    data: { galleryImages: [...place.galleryImages, url] },
  });
  console.log('Gallery updated:', [...place.galleryImages, url]);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());