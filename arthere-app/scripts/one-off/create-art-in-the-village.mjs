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
const IMAGES_DIR = path.join(__dirname, '../src/app/admin/places/ArtintheVillage');
const prisma = new PrismaClient();

async function uploadImage(filename, blobName, { width, height } = {}) {
  const raw = await readFile(path.join(IMAGES_DIR, filename));
  let pipeline = sharp(raw);
  if (width || height) pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
  const buf = await pipeline.webp({ quality: 90 }).toBuffer();
  console.log(`Uploading ${blobName} (${buf.byteLength} bytes)…`);
  const result = await put(`places/art-in-the-village/${blobName}`, buf, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'image/webp',
  });
  console.log('→', result.url);
  return result.url;
}

async function main() {
  // Upload all three images (resize large ones to max 2400px wide for web)
  const [heroUrl, gallery1Url, gallery2Url] = await Promise.all([
    uploadImage('artinthevillage_header', 'header.webp', { width: 2400 }),
    uploadImage('artinthevillage1',       'mural1.webp', { width: 2400 }),
    uploadImage('artinthevillage2',       'sign.webp',   { width: 1934 }),
  ]);

  // Check if the place already exists
  const existing = await prisma.place.findUnique({ where: { slug: 'art-in-the-village' } });
  if (existing) {
    const updated = await prisma.place.update({
      where: { slug: 'art-in-the-village' },
      data: {
        heroImageUrl:  heroUrl,
        galleryImages: [gallery1Url, gallery2Url],
        description:   'Art in the Village is a Multnomah Village-based community group dedicated to bringing new public murals to the neighborhood. They collaborate with local artists and businesses to commission works that reflect the character and creativity of the village. Their projects have transformed building walls into gathering points, making Multnomah Village a destination for public art.',
        website:       'https://www.google.com/maps/d/u/0/viewer?hl=en&ll=45.46894873550717%2C-122.71068050000001&z=17&mid=13ugRJHTTG_WgxsRhtFJGS585ZXbZHvE',
        neighborhood:  'Multnomah Village',
        inDirectory:   true,
      },
    });
    console.log('Updated existing place:', updated.id);
  } else {
    const place = await prisma.place.create({
      data: {
        slug:          'art-in-the-village',
        name:          'Art in the Village',
        neighborhood:  'Multnomah Village',
        description:   'Art in the Village is a Multnomah Village-based community group dedicated to bringing new public murals to the neighborhood. They collaborate with local artists and businesses to commission works that reflect the character and creativity of the village. Their projects have transformed building walls into gathering points, making Multnomah Village a destination for public art.',
        website:       'https://www.google.com/maps/d/u/0/viewer?hl=en&ll=45.46894873550717%2C-122.71068050000001&z=17&mid=13ugRJHTTG_WgxsRhtFJGS585ZXbZHvE',
        heroImageUrl:  heroUrl,
        galleryImages: [gallery1Url, gallery2Url],
        inDirectory:   true,
      },
    });
    console.log('Created place:', place.id, place.slug);
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());