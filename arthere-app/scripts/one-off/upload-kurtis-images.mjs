// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

const FOLDER = "/Users/mrogers/Desktop/Art Here - Project Folder/Multnomah Days Artists/Kurtis_Piltz";
const ARTIST_SLUG = 'kurtis-piltz';

const FILES = [
  { file: 'Kurtis_Piltz_bio.jpeg', role: 'bio' },
  { file: 'Kurtis_Piltz1.jpeg',    role: 'hero' },   // #1 = header image
  { file: 'Kurtis_Piltz2.jpeg',    role: 'artwork' },
  { file: 'Kurtis_Piltz3.jpeg',    role: 'artwork' },
  { file: 'Kurtis_Piltz4.jpeg',    role: 'artwork' },
];

async function upload(filePath, blobName) {
  const data = await readFile(filePath);
  const { url } = await put(blobName, data, {
    access: 'public',
    contentType: 'image/jpeg',
  });
  console.log(`✓ ${blobName} → ${url}`);
  return url;
}

const artist = await prisma.artist.findUnique({
  where: { slug: ARTIST_SLUG },
  select: { id: true, name: true },
});
if (!artist) { console.error('Artist not found'); process.exit(1); }
console.log(`Uploading images for ${artist.name} (${artist.id})\n`);

// Upload all files
const urls = {};
for (const { file, role } of FILES) {
  const blobName = `artists/${ARTIST_SLUG}/${file}`;
  urls[file] = { url: await upload(join(FOLDER, file), blobName), role };
}

const bioUrl  = Object.values(urls).find(u => u.role === 'bio')?.url;
const heroUrl = Object.values(urls).find(u => u.role === 'hero')?.url;
const artworkUrls = Object.values(urls).filter(u => u.role === 'artwork' || u.role === 'hero').map(u => u.url);

// Clear existing artwork images
await prisma.artworkImage.deleteMany({ where: { artistId: artist.id } });
console.log('\nCleared existing artwork images.');

// Insert new artwork images (hero first, then rest)
let sortOrder = 0;
for (const url of artworkUrls) {
  const isHero = url === heroUrl;
  await prisma.artworkImage.create({
    data: { artistId: artist.id, url, sortOrder: sortOrder++, isHero },
  });
}

// Update artist profile URLs
await prisma.artist.update({
  where: { id: artist.id },
  data: { bioPhotoUrl: bioUrl, heroImageUrl: heroUrl },
});

console.log(`\nDone!`);
console.log(`  Bio photo:   ${bioUrl}`);
console.log(`  Hero image:  ${heroUrl}`);
console.log(`  Artwork images: ${artworkUrls.length}`);

await prisma.$disconnect();