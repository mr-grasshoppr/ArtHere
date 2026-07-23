import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

function extractArtist(filepath, slug) {
  const content = readFileSync(filepath, 'utf8');

  const nameM = content.match(/class="artist-bio-name"[^>]*>([^<]+)/);
  const metaM = content.match(/class="artist-bio-meta-row"[^>]*>([\s\S]*?)<\/div>/);
  const bioM = content.match(/class="artist-bio-text"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
  const heroM = content.match(/class="artist-hero"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/);
  const photoM = content.match(/class="artist-bio-photo"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/);
  const igM = content.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
  const webM = content.match(/href="(https?:\/\/(?!(?:www\.)?instagram\.com)(?!fonts\.googleapis)[^"]+)"/);

  // Clean bio: strip tags, collapse whitespace, remove trailing nav text
  let bio = '';
  if (bioM) {
    bio = bioM[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim();
    // Remove trailing "Community XYZ" navigation artifact
    bio = bio.replace(/\s+Community\s+.*$/, '').trim();
  }

  // Clean medium: first segment before · or — or extra whitespace
  let medium = '';
  if (metaM) {
    const metaText = metaM[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    // Take everything before Portland/OR or · at end
    medium = metaText.replace(/\s*(Portland|Vancouver|OR|WA).*$/, '').replace(/[\s·—|]+$/, '').trim();
    // If multiple segments separated by lots of space, keep all non-location parts
    medium = medium.replace(/\s{2,}/g, ', ').trim();
  }

  const base = 'https://artishere.org';
  let hero = heroM ? heroM[1] : null;
  let photo = photoM ? photoM[1] : null;
  if (hero && hero.includes('logo')) hero = null;
  if (photo && photo.includes('logo')) photo = null;
  if (hero) hero = base + '/' + hero.replace(/^\.\.\//, '');
  if (photo) photo = base + '/' + photo.replace(/^\.\.\//, '');

  return {
    slug,
    name: nameM ? nameM[1].trim() : null,
    medium: medium || null,
    bio: bio || null,
    heroImageUrl: hero,
    bioPhotoUrl: photo,
    instagram: igM ? igM[1] : null,
    website: webM ? webM[1] : null,
  };
}

async function main() {
  const artistDir = join(__dirname, '../../artists');
  const files = readdirSync(artistDir).filter(f => f.endsWith('.html')).sort();

  const artists = files
    .map(f => extractArtist(join(artistDir, f), f.replace('.html', '')))
    .filter(a => a.bio && a.name)
    .slice(0, 30);

  console.log(`Importing ${artists.length} placeholder artists...`);

  // Find Portland city record
  const portland = await prisma.city.findUnique({ where: { slug: 'portland' } });
  if (!portland) console.warn('Warning: portland city not found, artists will have no cityId');

  let created = 0, skipped = 0;
  for (const a of artists) {
    const existing = await prisma.artist.findUnique({ where: { slug: a.slug } });
    if (existing) { skipped++; continue; }

    const placeholderEmail = `placeholder-${a.slug}@artishere.org`;
    const user = await prisma.user.upsert({
      where: { email: placeholderEmail },
      create: { email: placeholderEmail },
      update: {},
    });

    await prisma.artist.create({
      data: {
        userId: user.id,
        slug: a.slug,
        name: a.name,
        bio: a.bio,
        medium: a.medium,
        heroImageUrl: a.heroImageUrl,
        bioPhotoUrl: a.bioPhotoUrl,
        instagram: a.instagram,
        website: a.website,
        cityId: portland?.id ?? null,
        neighborhood: 'Portland, OR',
        isPlaceholder: true,
      },
    });
    created++;
    console.log(`  ✓ ${a.name}`);
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped (already exist).`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
