// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

/**
 * Retroactively detect and apply artwork cropping for Kristin Casaletto's images.
 * Uses Claude vision to find the artwork surface (excluding frame/wall/mat),
 * then sharp to crop and re-upload to Vercel Blob.
 *
 * Run from arthere-app/:
 *   node --env-file=.env --env-file=.env.local scripts/crop-kristin-images.mjs
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
      if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* file may not exist */ }
}

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function detectCrop(imageUrl) {
  const res = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          {
            type: 'text',
            text: `Look at this artwork image.

If a frame, mat, wall, or background surface is clearly visible around a flat wall-hanging work (painting, drawing, print, etc.), return the bounding box of just the artwork surface as JSON — excluding any visible frame, mat, or wall:
{"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}
where x and y are the top-left corner (as fractions of full image width/height) and w and h are the width and height of the artwork region (as fractions of full image width/height).

If the image shows a ceramic, sculpture, textile, fiber art, or other 3D/object work — OR if the artwork already fills the frame with no visible border, wall, or mat — return: null

Respond with ONLY the JSON object or null, nothing else.`,
          },
        ],
      },
    ],
  });

  const text = (res.content[0].type === 'text' ? res.content[0].text : '').trim();
  if (text === 'null' || !text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed.w <= 0.05 || parsed.h <= 0.05 || parsed.w > 1 || parsed.h > 1) return null;
    return parsed;
  } catch {
    return null;
  }
}


const artist = await prisma.artist.findUnique({
  where: { slug: 'kristin-casaletto' },
  select: { id: true, name: true, slug: true },
});
if (!artist) { console.error('Artist not found'); process.exit(1); }

const images = await prisma.artworkImage.findMany({
  where: { artistId: artist.id },
  orderBy: { sortOrder: 'asc' },
});

console.log(`Processing ${images.length} images for ${artist.name}\n`);

for (const img of images) {
  console.log(`[${img.id}] ${img.url}`);

  if (img.cropBox) {
    console.log(`  → already has cropBox, skipping\n`);
    continue;
  }

  const cropBox = await detectCrop(img.url);
  if (!cropBox) {
    console.log(`  → no crop needed (ceramic/object or already tight)\n`);
    continue;
  }

  console.log(`  → crop: x=${cropBox.x.toFixed(3)} y=${cropBox.y.toFixed(3)} w=${cropBox.w.toFixed(3)} h=${cropBox.h.toFixed(3)}`);

  await prisma.artworkImage.update({ where: { id: img.id }, data: { cropBox } });
  console.log(`  ✓ saved cropBox\n`);
}

await prisma.$disconnect();
console.log('Done.');