// One-off smoke test for Vercel Blob storage.
//
// Confirms that the @vercel/blob SDK can authenticate (via VERCEL_OIDC_TOKEN +
// BLOB_STORE_ID, or BLOB_READ_WRITE_TOKEN) and successfully upload a file,
// returning a public URL.
//
// Usage:
//   node scripts/test-blob-upload.mjs [path/to/image.jpg]
//
// If no path is given, it defaults to a sample image from the static site's
// /images/artwork directory.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- Minimal .env loader (no `dotenv` dependency in this project) ---
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// .env.local takes precedence over .env (mirrors Next.js's load order)
loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

async function main() {
  const hasOidc = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  const hasRwToken =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) &&
    process.env.BLOB_READ_WRITE_TOKEN !== "vercel_blob_stub";

  if (!hasOidc && !hasRwToken) {
    console.error(
      "✗ No usable Blob credentials found.\n" +
        "  Need either (VERCEL_OIDC_TOKEN + BLOB_STORE_ID) or a real BLOB_READ_WRITE_TOKEN in .env.local/.env."
    );
    process.exit(1);
  }

  console.log(
    `Auth method: ${hasOidc ? "OIDC token + BLOB_STORE_ID" : "BLOB_READ_WRITE_TOKEN"}`
  );

  // Resolve the file to upload
  const argPath = process.argv[2];
  const defaultImage = path.resolve(
    projectRoot,
    "..",
    "images",
    "artwork",
    "andrew-moran-1.jpg"
  );
  const filePath = argPath ? path.resolve(process.cwd(), argPath) : defaultImage;

  if (!existsSync(filePath)) {
    console.error(`✗ File not found: ${filePath}`);
    process.exit(1);
  }

  const fileBuffer = readFileSync(filePath);
  const fileName = `blob-smoke-test/${Date.now()}-${path.basename(filePath)}`;

  console.log(`Uploading "${filePath}" (${fileBuffer.length} bytes) as "${fileName}"...`);

  try {
    const blob = await put(fileName, fileBuffer, {
      access: "public",
      addRandomSuffix: true,
      // When using BLOB_READ_WRITE_TOKEN explicitly:
      ...(hasRwToken && !hasOidc ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
    });

    console.log("\n✓ Upload succeeded!");
    console.log(`  URL:          ${blob.url}`);
    console.log(`  Download URL: ${blob.downloadUrl}`);
    console.log(`  Pathname:     ${blob.pathname}`);
    console.log(
      "\nVisit the URL above in your browser to confirm the image is publicly viewable."
    );
  } catch (err) {
    console.error("\n✗ Upload failed:");
    console.error(err);
    process.exit(1);
  }
}

main();
