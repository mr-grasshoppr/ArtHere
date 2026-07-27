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

const FOLDER = "/Users/mrogers/Desktop/Art Here - Project Folder/Multnomah Days Artists/Kristin_Casaletto";
const SLUG = 'kristin-casaletto';
const PORTLAND_CITY_ID = 'cmq66pef900001ntm7zl9503b';

const FILES = [
  { file: 'Kristin_Casaletto_bio.webp', role: 'bio' },
  { file: 'Kristin_Casaletto1.webp',    role: 'artwork' },
  { file: 'Kristin_Casaletto2.webp',    role: 'artwork' },
  { file: 'Kristin_Casaletto3.webp',    role: 'hero' },   // #3 = header image
  { file: 'Kristin_Casaletto4.webp',    role: 'artwork' },
];

async function upload(filePath, blobName) {
  const data = await readFile(filePath);
  const { url } = await put(blobName, data, { access: 'public', contentType: 'image/webp' });
  console.log(`✓ ${blobName}`);
  return url;
}

// Upload all files
const uploaded = [];
for (const { file, role } of FILES) {
  const url = await upload(join(FOLDER, file), `artists/${SLUG}/${file}`);
  uploaded.push({ url, role });
}

const bioUrl  = uploaded.find(u => u.role === 'bio')?.url;
const heroUrl = uploaded.find(u => u.role === 'hero')?.url;
// Artwork gallery: all except bio, hero first in sort order
const artworkEntries = [
  ...uploaded.filter(u => u.role === 'hero'),
  ...uploaded.filter(u => u.role === 'artwork'),
];

// Create User + Artist
const user = await prisma.user.create({
  data: { email: `${SLUG}@placeholder.arthere.local` },
});

const artist = await prisma.artist.create({
  data: {
    userId: user.id,
    slug: SLUG,
    name: 'Kristin Casaletto',
    bio: "Kristin Casaletto is a Portland, Oregon artist working across painting and sculptural wood wall compositions. She's also the founder of Prohibition, a Portland studio specializing in branding, graphic design, and illustration.",
    website: 'https://www.kcasaletto.com/art',
    instagram: 'kristin.casaletto',
    bioPhotoUrl: bioUrl,
    heroImageUrl: heroUrl,
    isPlaceholder: false,
    cityId: PORTLAND_CITY_ID,
    artworkImages: {
      create: artworkEntries.map((e, i) => ({
        url: e.url,
        sortOrder: i,
        isHero: e.role === 'hero',
      })),
    },
  },
});

console.log(`\nCreated artist: ${artist.name} (${artist.id})`);
console.log(`  Bio photo:  ${bioUrl}`);
console.log(`  Hero image: ${heroUrl}`);
console.log(`  Artwork images: ${artworkEntries.length}`);

await prisma.$disconnect();