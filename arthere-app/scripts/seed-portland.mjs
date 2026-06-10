// Creates the Portland City record and links all existing cityless artists to it.
//
// Usage:
//   node scripts/seed-portland.mjs
//   node scripts/seed-portland.mjs --dry-run
//
// Safe to re-run: city is upserted, artist update is a no-op when already linked.

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

async function main() {
  console.log(`Seeding Portland city${DRY_RUN ? " [DRY RUN]" : ""}...`);

  const cityData = {
    slug: "portland",
    name: "Portland",
    state: "OR",
    displayName: "Portland, OR",
    logoOverlayImageUrl: "/images/arthere-portland-overlay.png",
  };

  if (DRY_RUN) {
    console.log("Would upsert city:", cityData);
    return;
  }

  const city = await prisma.city.upsert({
    where: { slug: "portland" },
    update: {
      name: cityData.name,
      state: cityData.state,
      displayName: cityData.displayName,
      logoOverlayImageUrl: cityData.logoOverlayImageUrl,
    },
    create: cityData,
  });

  console.log(`✓ City: ${city.displayName} (id: ${city.id})`);

  const updated = await prisma.artist.updateMany({
    where: { cityId: null },
    data: { cityId: city.id },
  });

  console.log(`✓ Linked ${updated.count} artist(s) to Portland`);

  const total = await prisma.artist.count({ where: { cityId: city.id } });
  console.log(`  Total artists in Portland: ${total}`);
}

main()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma?.disconnect?.() ?? prisma?.$disconnect?.());
