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
