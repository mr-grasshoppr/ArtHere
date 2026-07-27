// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

import sharp from 'sharp';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';

const INPUT = '/Users/mrogers/Documents/GitHub/ArtHere/arthere-app/src/app/admin/artists/Kevin_Tudball/Kevin_Tudball_bio.png';

async function main() {
  const raw = await readFile(INPUT);
  // Image is already a tight portrait crop (349×380); square it from top-center
  const buf = await sharp(raw)
    .resize(600, 600, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 92 })
    .toBuffer();

  console.log(`Uploading bio.jpg (${buf.byteLength} bytes)…`);
  const result = await put('artists/kevin-tudball/bio.jpg', buf, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'image/jpeg',
  });
  console.log('Done:', result.url);
}

main().catch(err => { console.error(err); process.exit(1); });