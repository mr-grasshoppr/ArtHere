// One-off backfill: AI-tag every untagged artwork image belonging to a
// non-placeholder ("live") artist. Idempotent (skips images that already
// have a medium), scoped to isPlaceholder: false so it doesn't burn API
// calls tagging demo/placeholder content.
//
//   node scripts/tag-live-artwork.mjs
//
// Mirrors tagArtworkImage + normalizeMediumTags in src/lib/claude.ts, and
// the artist-medium hint added there. Reads ANTHROPIC_API_KEY and
// DATABASE_URL from .env.local.
import { readFileSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();

function normalizeMediumTags(medium, mediumOptions) {
  if (!medium) return [];
  const canonical = new Set();
  for (const m of medium) {
    const match = mediumOptions.find((opt) => opt.toLowerCase() === String(m).trim().toLowerCase());
    if (match) canonical.add(match);
  }
  return [...canonical];
}

function parseMediumList(raw) {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

function stripJsonFence(text) {
  return text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
}

async function tagArtworkImage(imageUrl, artistMedium, mediumOptions) {
  const hint =
    artistMedium && artistMedium.length > 0
      ? `\n\nFor context, this artist's overall self-reported media are: ${artistMedium.join(', ')}. Use that only as a tiebreaker for ambiguous cases — base "medium" on what THIS image actually shows, even if it falls outside that list.`
      : '';

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          {
            type: 'text',
            text: `Analyze this artwork image and return a JSON object with these exact fields:
{
  "medium": ["one or more values from exactly this list: ${mediumOptions.join(', ')}"],
  "colors": ["list", "of", "3-6 dominant colors", "in plain language"],
  "scale": "small|medium|large|monumental",
  "orientation": "landscape|portrait|square|irregular",
  "style": ["list", "of", "art styles"],
  "subjects": ["list", "of", "subject matter"],
  "indoor_outdoor": "indoor|outdoor|both",
  "mood": ["list", "of", "2-4 mood descriptors"],
  "wall_art": true/false,
  "functional": true/false,
  "description": "One concise sentence describing this artwork for search purposes"
}

Return ONLY the JSON object, no other text. For "medium", pick every value from the list above that applies to THIS SPECIFIC piece based on what's visible in the image — do not guess at the artist's other work. A piece can have more than one medium (e.g. a carved and painted wood piece is both "Woodworking" and "Painting") — include every value that genuinely applies. Use "New Media" for video/digital work; use "Installation" for site-specific or multi-part installation work. Be specific about colors (e.g. "dusty rose" not just "pink"). For scale, consider: small = under 18 inches, medium = 18-36 inches, large = 36-72 inches, monumental = over 72 inches.${hint}`,
          },
        ],
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return JSON.parse(stripJsonFence(text));
}

async function main() {
  const artists = await prisma.artist.findMany({
    where: { isPlaceholder: false },
    select: {
      id: true,
      name: true,
      medium: true,
      artworkImages: { select: { id: true, url: true, medium: true } },
    },
  });

  const mediumOptionRows = await prisma.mediumOption.findMany({ orderBy: { sortOrder: 'asc' } });
  const mediumOptions = mediumOptionRows.map((r) => r.label);

  const todo = [];
  for (const artist of artists) {
    for (const img of artist.artworkImages) {
      if (img.medium.length === 0) todo.push({ artist, img });
    }
  }
  console.log(`${artists.length} live artists, ${todo.length} untagged images to process`);
  console.log(`Medium vocabulary: ${mediumOptions.join(', ')}`);

  let tagged = 0, needsReview = 0, failed = 0;
  for (const { artist, img } of todo) {
    try {
      const tags = await tagArtworkImage(img.url, parseMediumList(artist.medium), mediumOptions);
      const medium = normalizeMediumTags(tags.medium, mediumOptions);
      await prisma.artworkImage.update({
        where: { id: img.id },
        data: { aiTags: tags, aiTaggedAt: new Date(), medium },
      });
      if (medium.length > 0) {
        tagged++;
        console.log(`  OK  ${artist.name} / ${img.url.split('/').pop()} -> ${medium.join(', ')}`);
      } else {
        needsReview++;
        console.log(`  ??  ${artist.name} / ${img.url.split('/').pop()} -> no confident medium, queued for review`);
      }
    } catch (e) {
      failed++;
      console.error(`  FAIL ${artist.name} / ${img.url.split('/').pop()}:`, e.message);
    }
  }

  console.log(`\nDone. Tagged: ${tagged}, needs manual review: ${needsReview}, failed: ${failed}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
