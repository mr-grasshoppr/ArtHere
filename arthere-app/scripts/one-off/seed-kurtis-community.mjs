// Adds the "Community" links shown on Kurtis Piltz's artist profile page,
// matching the static prototype (artists/kurtis-piltz.html): the schools and
// arts centers where he teaches/studied.
//
// Usage:
//   node scripts/seed-kurtis-community.mjs
//   node scripts/seed-kurtis-community.mjs --dry-run
//
// Safe to re-run: places are upserted by slug, and the artist<->place link
// is upserted by the (artistId, placeId, relationship) unique key.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

function loadEnvFile(filePath, { force = false } = {}) {
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (force || !(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(projectRoot, ".env.local"), { force: true });
loadEnvFile(path.join(projectRoot, ".env"));

const prisma = DRY_RUN ? null : new PrismaClient();

const ARTIST_SLUG = "kurtis-piltz";

// Order matches the static page's community-list.
const PLACES = [
  {
    slug: "multnomah-arts-center",
    name: "Multnomah Arts Center",
    website: "https://www.multnomahartscenter.org",
    relationship: "INSTRUCTOR",
  },
  {
    slug: "catlin-gabel-community-arts-program",
    name: "Catlin Gabel Community Arts Program",
    website: "https://www.catlingabel.org/community",
    relationship: "INSTRUCTOR",
  },
  {
    slug: "portland-state-university",
    name: "Portland State University",
    website: "https://www.pdx.edu",
    relationship: "STUDENT",
  },
  {
    slug: "portland-community-college",
    name: "Portland Community College",
    website: "https://www.pcc.edu",
    relationship: "STUDENT",
  },
];

async function main() {
  console.log(`Seeding Kurtis Piltz's community links${DRY_RUN ? " [DRY RUN]" : ""}...`);

  if (DRY_RUN) {
    for (const p of PLACES) {
      console.log(`  would upsert place "${p.name}" (${p.slug}) and link as ${p.relationship}`);
    }
    console.log("Done.");
    return;
  }

  const artist = await prisma.artist.findUnique({ where: { slug: ARTIST_SLUG } });
  if (!artist) {
    throw new Error(`No artist found with slug "${ARTIST_SLUG}"`);
  }

  for (const p of PLACES) {
    const place = await prisma.place.upsert({
      where: { slug: p.slug },
      update: { name: p.name, website: p.website },
      create: { slug: p.slug, name: p.name, website: p.website },
    });

    await prisma.artistPlace.upsert({
      where: {
        artistId_placeId_relationship: {
          artistId: artist.id,
          placeId: place.id,
          relationship: p.relationship,
        },
      },
      update: {},
      create: {
        artistId: artist.id,
        placeId: place.id,
        relationship: p.relationship,
      },
    });

    console.log(`  ✓ ${p.name} -> ${p.relationship}`);
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
