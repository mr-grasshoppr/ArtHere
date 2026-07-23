// Fills in "neighborhood" and a short "description" for the Community
// places that already exist in the DB, for the ones we have confident
// reference info for (matches js/places.js from the static prototype).
//
// Places not listed here are left as-is — they'll just show their name
// and connected artists on the Community page until more info is added.
//
// Usage:
//   node scripts/seed-place-details.mjs
//   node scripts/seed-place-details.mjs --dry-run

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

const DETAILS = {
  "nw-marine-art-works": {
    neighborhood: "NW Industrial",
    description:
      "A converted WWII-era industrial complex with 75+ artist studios, hosting Open Studios events each spring and winter.",
  },
  "portland-art-studios": {
    neighborhood: "NW Industrial",
    description: "A four-building collective of artist studios in NW Industrial.",
  },
  "multnomah-arts-center": {
    neighborhood: "Multnomah Village",
    description: "A community arts center offering classes, studio space, and a gallery.",
  },
  "comeunity-pdx": {
    neighborhood: "NE Portland",
    description: "A retail shop, gallery, and event space supporting local makers.",
  },
  "alberta-street-gallery": {
    neighborhood: "Alberta Arts District",
    description: "A member-run gallery on Alberta Street.",
  },
};

async function main() {
  console.log(`Seeding place details${DRY_RUN ? " [DRY RUN]" : ""}...`);

  for (const [slug, data] of Object.entries(DETAILS)) {
    if (DRY_RUN) {
      console.log(`  would update "${slug}" ->`, data);
      continue;
    }

    const place = await prisma.place.findUnique({ where: { slug } });
    if (!place) {
      console.warn(`  ! No place found with slug "${slug}", skipping`);
      continue;
    }

    await prisma.place.update({ where: { slug }, data });
    console.log(`  ✓ ${place.name} -> neighborhood: "${data.neighborhood}"`);
  }

  if (!DRY_RUN) await prisma.$disconnect();
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
