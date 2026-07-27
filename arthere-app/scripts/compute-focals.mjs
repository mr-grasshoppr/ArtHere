// Backfill image focal points for every existing image (artist heroes, bio
// photos, artwork, and place hero/thumbnail/gallery images). Idempotent: skips
// URLs already in ImageFocus. Safe to re-run. Reusable maintenance script.
//
//   node scripts/compute-focals.mjs
//
// Uses the same vision prompt as src/lib/claude.ts detectFocalPoint. Reads
// ANTHROPIC_API_KEY and DATABASE_URL from .env.local.
import { readFileSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

// Load .env.local into process.env (a raw node script doesn't auto-load it).
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();

const PROMPT = `This image will be cropped to fit banners, square thumbnails, and tiles of varying shapes. Pick the single point that should always stay centered in frame.

Rules, in priority order:
1. If there are people, the point must keep their faces/heads visible — never choose a point that would crop through a head.
2. Otherwise center on the main subject or artwork (e.g. a mural, sign, painting), not empty sky, ground, or background.

Respond with ONLY a JSON object of the point as percentages of the image's width and height, top-left origin:
{"x": 50, "y": 40}`;

async function detectFocal(url) {
  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 100,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'url', url } },
      { type: 'text', text: PROMPT },
    ] }],
  });
  const text = (res.content[0]?.type === 'text' ? res.content[0].text : '').trim();
  const json = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const p = JSON.parse(json);
  const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
  if (typeof p.x !== 'number' || typeof p.y !== 'number') return null;
  return { x: clamp(p.x), y: clamp(p.y) };
}

async function main() {
  const artists = await prisma.artist.findMany({
    select: { heroImageUrl: true, bioPhotoUrl: true, artworkImages: { select: { url: true } } },
  });
  const places = await prisma.place.findMany({
    select: { heroImageUrl: true, thumbnailImageUrl: true, galleryImages: true },
  });

  const urls = new Set();
  for (const a of artists) {
    if (a.heroImageUrl) urls.add(a.heroImageUrl);
    if (a.bioPhotoUrl) urls.add(a.bioPhotoUrl);
    a.artworkImages.forEach(i => urls.add(i.url));
  }
  for (const p of places) {
    if (p.heroImageUrl) urls.add(p.heroImageUrl);
    if (p.thumbnailImageUrl) urls.add(p.thumbnailImageUrl);
    p.galleryImages.forEach(u => urls.add(u));
  }

  const existing = new Set((await prisma.imageFocus.findMany({ select: { url: true } })).map(r => r.url));
  const todo = [...urls].filter(u => !existing.has(u));
  console.log(`${urls.size} images total, ${todo.length} need a focal point`);

  let done = 0, failed = 0;
  for (const url of todo) {
    try {
      const focal = await detectFocal(url);
      if (!focal) { failed++; continue; }
      await prisma.imageFocus.upsert({
        where: { url }, create: { url, x: focal.x, y: focal.y }, update: { x: focal.x, y: focal.y },
      });
      done++;
      if (done % 20 === 0) console.log(`  ${done}/${todo.length}`);
    } catch (e) {
      failed++;
      console.error('FAILED', url.split('/').pop(), e.message);
    }
  }
  console.log(`Done: ${done} computed, ${failed} failed/skipped.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
