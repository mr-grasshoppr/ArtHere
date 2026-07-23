// Re-crop the Art in the Village header so the mural text sits at the
// bottom of the hero strip. Original is 4000×3000; text is in the upper
// ~1100px. We extract just that band and upload it as the new hero.
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, '../src/app/admin/places/ArtintheVillage/artinthevillage_header');

async function main() {
  const raw = await readFile(INPUT);
  // Crop full width, top 1100px — keeps sky + full mural text, drops the car
  const buf = await sharp(raw)
    .extract({ left: 0, top: 0, width: 4000, height: 1100 })
    .resize(2400, null)
    .webp({ quality: 90 })
    .toBuffer();

  console.log(`Uploading recropped header (${buf.byteLength} bytes)…`);
  const { url } = await put('places/art-in-the-village/header.webp', buf, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'image/webp',
  });
  console.log('→', url);
}

main().catch(err => { console.error(err); process.exit(1); });
