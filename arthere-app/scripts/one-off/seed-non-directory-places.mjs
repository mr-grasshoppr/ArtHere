// Re-adds the places that were removed from the Community directory
// (closed venues, schools, a college/university, a cafe, a barbershop) so
// they still show up as plain-text "Community" mentions on the relevant
// artist's profile — just marked inDirectory: false, so they're excluded
// from the city Community page and aren't rendered as links.
//
// Usage:
//   node scripts/seed-non-directory-places.mjs
//   node scripts/seed-non-directory-places.mjs --dry-run
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

// Map of artist slug -> places to link, marked inDirectory: false.
const ARTISTS = {
  "beth-bundy": [
    {
      slug: "lincoln-high-school",
      name: "Lincoln High School",
      website: "https://www.pps.net/lincoln",
      relationship: "INSTRUCTOR",
    },
    {
      slug: "clinton-street-coffeehouse",
      name: "Clinton Street Coffeehouse",
      website: null,
      relationship: "EXHIBITING_ARTIST",
    },
    {
      slug: "rudys-barbershop",
      name: "Rudy's Barbershop",
      website: null,
      relationship: "EXHIBITING_ARTIST",
    },
  ],
  "jennifer-eaton-white": [
    {
      slug: "smith-and-vallee-gallery",
      name: "Smith & Vallee Gallery (closed Dec 2025)",
      website: null,
      relationship: "EXHIBITING_ARTIST",
    },
  ],
  "kurtis-piltz": [
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
  ],
};

async function main() {
  console.log(`Seeding non-directory community mentions${DRY_RUN ? " [DRY RUN]" : ""}...`);

  for (const [artistSlug, places] of Object.entries(ARTISTS)) {
    console.log(`\n${artistSlug}:`);

    if (DRY_RUN) {
      for (const p of places) {
        console.log(`  would upsert place "${p.name}" (${p.slug}, inDirectory: false) and link as ${p.relationship}`);
      }
      continue;
    }

    const artist = await prisma.artist.findUnique({ where: { slug: artistSlug } });
    if (!artist) {
      throw new Error(`No artist found with slug "${artistSlug}"`);
    }

    for (const p of places) {
      const place = await prisma.place.upsert({
        where: { slug: p.slug },
        update: { name: p.name, website: p.website, inDirectory: false },
        create: { slug: p.slug, name: p.name, website: p.website, inDirectory: false },
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

      console.log(`  ✓ ${p.name} -> ${p.relationship} (inDirectory: false)`);
    }
  }

  if (!DRY_RUN) await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
