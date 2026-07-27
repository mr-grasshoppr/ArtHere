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