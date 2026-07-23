import sharp from 'sharp';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT = path.join(__dirname, '../src/app/admin/artists/Kevin_Tudball/Kevin_Tudball_bio.png');

// Original is 1004×1158.
// Kevin's face center is at ~x=500, y=190.
// Crop a 900×900 square from the top-center so face occupies ~23% of the output.
const CROP_X = Math.round((1004 - 900) / 2); // 52
const CROP_Y = 0;
const CROP_SIZE = 900;
const OUTPUT_SIZE = 600;

async function main() {
  const img = await readFile(INPUT);

  const cropped = await sharp(img)
    .extract({ left: CROP_X, top: CROP_Y, width: CROP_SIZE, height: CROP_SIZE })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE)
    .jpeg({ quality: 92 })
    .toBuffer();

  console.log(`Uploading cropped bio photo (${cropped.byteLength} bytes)…`);

  const result = await put('artists/kevin-tudball/bio.jpg', cropped, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'image/jpeg',
  });

  console.log('Uploaded:', result.url);
}

main().catch(err => { console.error(err); process.exit(1); });
