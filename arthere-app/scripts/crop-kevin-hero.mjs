// Crop Kevin_Tudball4.webp: remove the brown kraft paper border so only the
// white illustration area remains.
import sharp from 'sharp';
import { put } from '@vercel/blob';

const SOURCE_URL = 'https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/artists/kevin-tudball/Kevin_Tudball4.webp';

// 1000×1000 image; kraft paper border ~55px left/right, ~65px top/bottom.
const CROP = { left: 55, top: 65, width: 890, height: 875 };

async function main() {
  console.log('Fetching Kevin_Tudball4.webp…');
  const res = await fetch(SOURCE_URL);
  const buf = Buffer.from(await res.arrayBuffer());

  const cropped = await sharp(buf)
    .extract(CROP)
    .resize(900, 900)
    .webp({ quality: 92 })
    .toBuffer();

  console.log(`Uploading cropped hero (${cropped.byteLength} bytes)…`);
  const result = await put('artists/kevin-tudball/Kevin_Tudball4.webp', cropped, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'image/webp',
  });
  console.log('Uploaded:', result.url);
}

main().catch(err => { console.error(err); process.exit(1); });
