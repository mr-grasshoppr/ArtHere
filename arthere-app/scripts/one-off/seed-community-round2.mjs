// Adds the "Community" links for the next batch of Portland artist profile
// pages, matching the static prototype pages:
//   - artists/beth-bundy.html
//   - artists/jennifer-eaton-white.html
//   - artists/lindsey-fox.html (adding the one place missing from the DB)
//   - artists/yong-hong-zhong.html
//
// Usage:
//   node scripts/seed-community-round2.mjs
//   node scripts/seed-community-round2.mjs --dry-run
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

// Map of artist slug -> places to link, in display order.
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
    {
      slug: "alberta-street-gallery",
      name: "Alberta Street Gallery",
      website: "https://www.albertastreetgallery.com",
      relationship: "EXHIBITING_ARTIST",
    },
    {
      slug: "casa-luna-art-and-artifacts",
      name: "Casa Luna Art & Artifacts",
      website: "https://www.instagram.com/casa.luna.ws/",
      relationship: "EXHIBITING_ARTIST",
    },
  ],
  "lindsey-fox": [
    {
      slug: "comeunity-pdx",
      name: "ComeUnity PDX",
      website: "https://www.comeunitypdx.com",
      relationship: "MEMBER",
    },
  ],
  "yong-hong-zhong": [
    {
      slug: "pam-rental-sales-gallery",
      name: "PAM Rental Sales",
      website: "https://www.rentalsalesgallery.com/",
      relationship: "EXHIBITING_ARTIST",
    },
    {
      slug: "alberta-street-gallery",
      name: "Alberta Street Gallery",
      website: "https://www.albertastreetgallery.com",
      relationship: "EXHIBITING_ARTIST",
    },
  ],
};

async function main() {
  console.log(`Seeding community links${DRY_RUN ? " [DRY RUN]" : ""}...`);

  for (const [artistSlug, places] of Object.entries(ARTISTS)) {
    console.log(`\n${artistSlug}:`);

    if (DRY_RUN) {
      for (const p of places) {
        console.log(`  would upsert place "${p.name}" (${p.slug}) and link as ${p.relationship}`);
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
  }

  if (!DRY_RUN) await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
