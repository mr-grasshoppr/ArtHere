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
