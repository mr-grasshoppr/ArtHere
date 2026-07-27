// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

/**
 * Creates Kevin Tudball's artist record and uploads his images.
 * Also creates "Art in the Village" place and updates Kristin's medium.
 *
 * Run from arthere-app/:
 *   node scripts/upload-kevin-images.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const file of ['.env', '.env.local']) {
  try {
    const raw = readFileSync(resolve(__dirname, '..', file), 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* file may not exist */ }
}

import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

const FOLDER = '/Users/mrogers/Documents/GitHub/ArtHere/arthere-app/src/app/admin/artists/Kevin_Tudball';
const ARTIST_SLUG = 'kevin-tudball';
const PORTLAND_CITY_ID = 'cmq66pef900001ntm7zl9503b';

const FILES = [
  { file: 'Kevin_Tudball_bio.png', role: 'bio' },
  { file: 'Kevin_Tudball1.webp', role: 'hero' },
  { file: 'Kevin_Tudball2.webp', role: 'artwork' },
  { file: 'Kevin_Tudball3.webp', role: 'artwork' },
  { file: 'Kevin_Tudball4.webp', role: 'artwork' },
];

async function upload(filePath, blobName, contentType) {
  const data = await readFile(filePath);
  const { url } = await put(blobName, data, { access: 'public', contentType });
  console.log(`✓ ${blobName}`);
  return url;
}

async function uploadBio(filePath, blobName) {
  const data = await readFile(filePath);
  const processed = await sharp(data)
    .resize(600, 600, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 88 })
    .toBuffer();
  const { url } = await put(blobName, processed, { access: 'public', contentType: 'image/jpeg' });
  console.log(`✓ ${blobName} (cropped bio)`);
  return url;
}

// ─── 1. Create or find "Art in the Village" place ─────────────────────────────
let place = await prisma.place.findFirst({ where: { name: { equals: 'Art in the Village', mode: 'insensitive' } } });
if (!place) {
  place = await prisma.place.create({
    data: {
      name: 'Art in the Village',
      slug: 'art-in-the-village',
      neighborhood: 'Multnomah Village',
      inDirectory: true,
    },
  });
  console.log(`Created place: Art in the Village (${place.id})`);
} else {
  console.log(`Found place: Art in the Village (${place.id})`);
}

// ─── 2. Create or find Kevin's user + artist record ───────────────────────────
let user = await prisma.user.findFirst({ where: { OR: [{ email: 'info@kevintudball.com' }, { email: 'kevin@kevintudball.com' }] } });
if (!user) {
  user = await prisma.user.create({ data: { email: 'info@kevintudball.com', name: 'Kevin Tudball' } });
} else if (user.email !== 'info@kevintudball.com') {
  user = await prisma.user.update({ where: { id: user.id }, data: { email: 'info@kevintudball.com' } });
}

let artist = await prisma.artist.findUnique({ where: { slug: ARTIST_SLUG } });
if (!artist) {
  artist = await prisma.artist.create({
    data: {
      userId: user.id,
      slug: ARTIST_SLUG,
      name: 'Kevin Tudball',
      bio: "Kevin is a Multnomah Village-based illustrator and graphic designer. He sells his original work at kevintudball.com/store, and his clients include REI, Washington Post, LegalZoom, Verve, Four Barrel and more.",
      medium: 'Illustration',
      neighborhood: 'Multnomah Village',
      website: 'https://www.kevintudball.com/store',
      instagram: 'kevintudball',
      isPlaceholder: false,
      cityId: PORTLAND_CITY_ID,
    },
  });
  console.log(`Created artist: Kevin Tudball (${artist.id})`);
} else {
  artist = await prisma.artist.update({
    where: { id: artist.id },
    data: {
      bio: "Kevin is a Multnomah Village-based illustrator and graphic designer. He sells his original work at kevintudball.com/store, and his clients include REI, Washington Post, LegalZoom, Verve, Four Barrel and more.",
      medium: 'Illustration',
      neighborhood: 'Multnomah Village',
      website: 'https://www.kevintudball.com/store',
      instagram: 'kevintudball',
      isPlaceholder: false,
      cityId: PORTLAND_CITY_ID,
    },
  });
  console.log(`Updated artist: Kevin Tudball (${artist.id})`);
}

// ─── 3. Associate Kevin with Art in the Village ────────────────────────────────
await prisma.artistPlace.upsert({
  where: { artistId_placeId_relationship: { artistId: artist.id, placeId: place.id, relationship: 'EXHIBITING_ARTIST' } },
  create: { artistId: artist.id, placeId: place.id, relationship: 'EXHIBITING_ARTIST' },
  update: {},
});
console.log('Linked Kevin → Art in the Village (Exhibiting Artist)');

// ─── 4. Upload images ──────────────────────────────────────────────────────────
const urls = {};
for (const { file, role } of FILES) {
  const filePath = join(FOLDER, file);
  const ext = file.endsWith('.png') ? 'png' : 'webp';
  const contentType = role === 'bio' ? 'image/jpeg' : `image/${ext}`;
  const blobName = `artists/${ARTIST_SLUG}/${file}`;

  if (role === 'bio') {
    urls[file] = { url: await uploadBio(filePath, `artists/${ARTIST_SLUG}/bio.jpg`), role };
  } else {
    urls[file] = { url: await upload(filePath, blobName, contentType), role };
  }
}

const bioUrl  = Object.values(urls).find(u => u.role === 'bio')?.url;
const heroUrl = Object.values(urls).find(u => u.role === 'hero')?.url;
const artworkUrls = Object.values(urls).filter(u => u.role === 'artwork' || u.role === 'hero').map(u => u.url);

// ─── 5. Save artwork images ────────────────────────────────────────────────────
await prisma.artworkImage.deleteMany({ where: { artistId: artist.id } });
let sortOrder = 0;
for (const url of artworkUrls) {
  await prisma.artworkImage.create({
    data: { artistId: artist.id, url, sortOrder: sortOrder++, isHero: url === heroUrl },
  });
}

await prisma.artist.update({
  where: { id: artist.id },
  data: { bioPhotoUrl: bioUrl, heroImageUrl: heroUrl },
});

// ─── 6. Update Kristin's medium ───────────────────────────────────────────────
await prisma.artist.updateMany({
  where: { slug: 'kristin-casaletto' },
  data: { medium: 'Painting and woodworking' },
});
console.log("Updated Kristin's medium to 'Painting and woodworking'");

await prisma.$disconnect();

console.log(`\nDone!`);
console.log(`  Kevin bio:   ${bioUrl}`);
console.log(`  Kevin hero:  ${heroUrl}`);
console.log(`  Artwork:     ${artworkUrls.length} images`);