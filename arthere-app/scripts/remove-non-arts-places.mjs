// Removes Places that are either no longer open, or not primarily about
// the arts (schools, universities, cafes, barbershops, etc). Deleting a
// Place cascades to its ArtistPlace links (see prisma/schema.prisma), so
// this also removes the connection from the relevant artist's profile
// "Community" section and from the city Community page.
//
// Usage:
//   node scripts/remove-non-arts-places.mjs
//   node scripts/remove-non-arts-places.mjs --dry-run

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

// slug -> reason (just for logging)
const SLUGS_TO_REMOVE = {
  "smith-and-vallee-gallery": "closed Dec 2025",
  "lincoln-high-school": "school",
  "clinton-street-coffeehouse": "cafe",
  "rudys-barbershop": "barbershop, not arts-focused",
  "portland-state-university": "university",
  "portland-community-college": "college",
};

async function main() {
  console.log(`Removing non-arts / closed places${DRY_RUN ? " [DRY RUN]" : ""}...`);

  for (const [slug, reason] of Object.entries(SLUGS_TO_REMOVE)) {
    if (DRY_RUN) {
      console.log(`  would delete "${slug}" (${reason})`);
      continue;
    }

    const place = await prisma.place.findUnique({ where: { slug } });
    if (!place) {
      console.warn(`  ! No place found with slug "${slug}", skipping`);
      continue;
    }

    await prisma.place.delete({ where: { slug } });
    console.log(`  ✓ removed "${place.name}" (${reason})`);
  }

  if (!DRY_RUN) await prisma.$disconnect();
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
