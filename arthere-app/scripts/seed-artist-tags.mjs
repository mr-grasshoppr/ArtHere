// Sets the "medium" (craft/discipline) and "neighborhood" (location) tags
// for the initial Portland artist roster, matching the values used in the
// static prototype's artist directory page (pages/artists.html).
//
// Usage:
//   node scripts/seed-artist-tags.mjs
//   node scripts/seed-artist-tags.mjs --dry-run
//
// Safe to re-run: each artist row is updated to the values below.

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

const TAGS = [
  { slug: "kurtis-piltz", medium: "Ceramicist", neighborhood: "Multnomah Village" },
  { slug: "beth-bundy", medium: "Illustrator", neighborhood: "Alberta Arts District" },
  { slug: "yong-hong-zhong", medium: "Painter", neighborhood: "Portland" },
  { slug: "lindsey-fox", medium: "Painter", neighborhood: "Portland" },
  { slug: "jennifer-eaton-white", medium: "Painter", neighborhood: "Vancouver, WA" },
];

async function main() {
  console.log(`Seeding artist medium/neighborhood tags${DRY_RUN ? " [DRY RUN]" : ""}...`);

  for (const { slug, medium, neighborhood } of TAGS) {
    if (DRY_RUN) {
      console.log(`  would update ${slug} -> medium="${medium}", neighborhood="${neighborhood}"`);
      continue;
    }
    const result = await prisma.artist.updateMany({
      where: { slug },
      data: { medium, neighborhood },
    });
    if (result.count === 0) {
      console.log(`  ! no artist found with slug "${slug}" — skipped`);
    } else {
      console.log(`  ✓ ${slug} -> medium="${medium}", neighborhood="${neighborhood}"`);
    }
  }

  if (!DRY_RUN) await prisma.$disconnect();
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
