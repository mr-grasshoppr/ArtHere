import sharp from 'sharp';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, '../src/app/admin/artists/Kevin_Tudball/Kevin_Tudball_header.png');
const prisma = new PrismaClient();

async function main() {
  const raw = await readFile(INPUT);
  const buf = await sharp(raw)
    .resize(2000, null, { withoutEnlargement: true })
    .webp({ quality: 92 })
    .toBuffer();

  console.log(`Uploading ${buf.byteLength} bytes…`);
  const { url } = await put('artists/kevin-tudball/Kevin_Tudball_header.webp', buf, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'image/webp',
  });
  console.log('Uploaded:', url);

  await prisma.artist.update({
    where: { slug: 'kevin-tudball' },
    data: { heroImageUrl: url },
  });
  console.log('heroImageUrl set on artist record.');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
