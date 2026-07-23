// Seed script: ports a small batch of artist profiles from the static HTML
// site into the Postgres DB (via Prisma) and Vercel Blob (for images).
//
// Usage:
//   node scripts/seed-content.mjs            # parse, upload images, write to DB
//   node scripts/seed-content.mjs --dry-run  # parse + print only, no uploads/writes
//
// Scope (intentionally a small first batch — see CLAUDE.md / project notes):
//   5 "core" artists with consistent HTML structure:
//     kurtis-piltz, beth-bundy, yong-hong-zhong, lindsey-fox, jennifer-eaton-white
//
// What it does per artist:
//   1. Parses artists/<slug>.html (name, meta row, bio, links, community, images)
//   2. Uploads bio photo / hero / gallery images to Vercel Blob (public)
//   3. Upserts a placeholder User + Artist record, replaces ArtworkImage rows
//   4. Best-effort links community items that point at ../places/<slug>.html to
//      a minimal stub Place record via ArtistPlace (relationship: MEMBER)
//
// Re-running is safe: artists/users/places are upserted by slug/email, and each
// artist's ArtworkImage rows are deleted + recreated so the gallery stays in sync.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const staticRoot = path.resolve(projectRoot, "..");
const artistsDir = path.join(staticRoot, "artists");

const DRY_RUN = process.argv.includes("--dry-run");

// --- Minimal .env loader (mirrors scripts/test-blob-upload.mjs) ---
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
// .env.local must win even over vars that @prisma/client may have already
// preloaded from .env (it auto-loads .env as an import side effect) — so we
// force-overwrite from .env.local, then fill any remaining gaps from .env.
loadEnvFile(path.join(projectRoot, ".env.local"), { force: true });
loadEnvFile(path.join(projectRoot, ".env"));

const hasRwToken =
  Boolean(process.env.BLOB_READ_WRITE_TOKEN) &&
  process.env.BLOB_READ_WRITE_TOKEN !== "vercel_blob_stub";
const hasOidc = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);

if (!DRY_RUN && !hasRwToken && !hasOidc) {
  console.error(
    "✗ No usable Blob credentials found (need BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN+BLOB_STORE_ID)."
  );
  process.exit(1);
}

// --- The first batch ---
const ARTIST_SLUGS = [
  "kurtis-piltz",
  "beth-bundy",
  "yong-hong-zhong",
  "lindsey-fox",
  "jennifer-eaton-white",
];

// --- HTML helpers ---
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(str) {
  return decodeEntities(str.replace(/<[^>]+>/g, "")).trim();
}

function parseArtistHtml(html, slug) {
  const name = (html.match(/<h1 class="artist-bio-name">([^<]*)<\/h1>/) || [])[1]?.trim();
  const metaRowRaw = (html.match(/<div class="artist-bio-meta-row">([^<]*)<\/div>/) || [])[1];

  let medium = null;
  let neighborhood = null;
  let city = null;
  if (metaRowRaw) {
    const parts = decodeEntities(metaRowRaw)
      .split("·")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      city = parts.pop();
      neighborhood = parts.pop();
      medium = parts.join(" · ");
    } else if (parts.length === 2) {
      [medium, city] = parts;
    } else if (parts.length === 1) {
      [medium] = parts;
    }
  }

  const heroSrc = (html.match(/class="artist-hero">\s*<img src="([^"]*)"/) || [])[1];
  const bioPhotoSrc = (html.match(/class="artist-bio-photo"><img src="([^"]*)"/) || [])[1];

  const bioSection =
    (html.match(/<section class="artist-bio-section">([\s\S]*?)<\/section>/) || [])[1] || "";

  const bioParagraphs = [];
  let website = null;
  let instagram = null;

  const blockRe = /<(p|blockquote)(?:\s+class="([^"]*)")?[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = blockRe.exec(bioSection))) {
    const [, tag, cls, inner] = m;
    if (cls === "link-line") {
      const linkRe = /<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
      let lm;
      while ((lm = linkRe.exec(inner))) {
        const [, href, text] = lm;
        if (href.includes("instagram.com")) {
          if (!instagram) instagram = decodeEntities(text).trim().replace(/^@/, "");
        } else if (!website) {
          website = href;
        }
      }
    } else if (cls === "event-box" || /event-/.test(inner)) {
      // skip "upcoming event" widgets — not part of the bio copy
    } else {
      const text = stripTags(inner);
      if (text) {
        bioParagraphs.push(tag === "blockquote" ? `“${text.replace(/^[“"]+|[”"]+$/g, "")}”` : text);
      }
    }
  }

  // Community section — links to known Place pages, external links, plain mentions
  const community = [];
  const commSection =
    (html.match(/<section class="community-section">([\s\S]*?)<\/section>/) || [])[1] || "";
  const itemRe =
    /<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<span(?:\s+class="([^"]*)")?[^>]*>([\s\S]*?)<\/span>/g;
  let cm;
  while ((cm = itemRe.exec(commSection))) {
    if (cm[1] !== undefined) {
      const href = cm[1];
      const text = stripTags(cm[2]);
      const placeMatch = href.match(/\.\.\/places\/([a-z0-9-]+)\.html/);
      if (text) community.push({ name: text, href, placeSlug: placeMatch ? placeMatch[1] : null });
    } else if (cm[4] !== undefined) {
      // top-level <span> mentions (e.g. "Clinton Street Coffeehouse"); skip
      // nested <span class="closed-note"> annotations picked up redundantly
      if (cm[3] === "closed-note") continue;
      const text = stripTags(cm[4]).replace(/\s*\(closed[^)]*\)\s*$/i, "").trim();
      if (text) community.push({ name: text, href: null, placeSlug: null });
    }
  }

  // Gallery images
  const galleryImages = [];
  const galleryMatch = html.match(/<div class="artwork-gallery">([\s\S]*?)<\/div>\s*\n*\s*<a/);
  if (galleryMatch) {
    const imgRe = /<img src="([^"]*)"/g;
    let gm;
    while ((gm = imgRe.exec(galleryMatch[1]))) galleryImages.push(gm[1]);
  }

  return {
    slug,
    name,
    medium,
    neighborhood,
    city,
    heroSrc,
    bioPhotoSrc,
    bio: bioParagraphs.join("\n\n"),
    website,
    instagram,
    community,
    galleryImages,
  };
}

// --- Image upload (cached by resolved local path; stable pathnames so re-runs overwrite) ---
const blobUrlCache = new Map();

function resolveImagePath(relativeFromArtistsDir) {
  return path.resolve(artistsDir, relativeFromArtistsDir);
}

async function uploadImage(relativeSrc, blobFolder) {
  if (!relativeSrc) return null;
  const localPath = resolveImagePath(relativeSrc);
  if (blobUrlCache.has(localPath)) return blobUrlCache.get(localPath);

  if (!existsSync(localPath)) {
    console.warn(`    ! image not found on disk: ${localPath}`);
    return null;
  }

  const filename = `${blobFolder}/${path.basename(localPath)}`;

  if (DRY_RUN) {
    const fakeUrl = `(dry-run) blob://${filename}`;
    blobUrlCache.set(localPath, fakeUrl);
    return fakeUrl;
  }

  const buffer = readFileSync(localPath);
  const blob = await put(filename, buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    ...(hasRwToken && !hasOidc ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
  });
  blobUrlCache.set(localPath, blob.url);
  return blob.url;
}

// --- Main ---
const prisma = DRY_RUN ? null : new PrismaClient();

function slugToTitle(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function seedArtist(slug) {
  const filePath = path.join(artistsDir, `${slug}.html`);
  if (!existsSync(filePath)) {
    console.warn(`✗ ${slug}: HTML file not found at ${filePath}, skipping`);
    return;
  }
  const html = readFileSync(filePath, "utf-8");
  const parsed = parseArtistHtml(html, slug);

  console.log(`\n— ${parsed.name ?? slug} (${slug}) —`);
  console.log(`  meta: ${[parsed.medium, parsed.neighborhood, parsed.city].filter(Boolean).join(" · ")}`);
  console.log(`  bio: ${parsed.bio.slice(0, 90)}${parsed.bio.length > 90 ? "…" : ""}`);
  console.log(`  website: ${parsed.website ?? "—"}  instagram: ${parsed.instagram ?? "—"}`);
  console.log(`  community: ${parsed.community.map((c) => c.name + (c.placeSlug ? ` [place:${c.placeSlug}]` : "")).join(", ") || "—"}`);
  console.log(`  images: bioPhoto=${parsed.bioPhotoSrc ?? "—"} hero=${parsed.heroSrc ?? "—"} gallery=${parsed.galleryImages.length}`);

  if (!parsed.name) {
    console.warn(`  ! could not parse <h1 class="artist-bio-name">, skipping ${slug}`);
    return;
  }

  // Upload images
  const bioPhotoUrl = await uploadImage(parsed.bioPhotoSrc, `artists/${slug}`);
  const heroImageUrl = await uploadImage(parsed.heroSrc, `artists/${slug}`);
  const galleryUrls = [];
  for (const src of parsed.galleryImages) {
    const url = await uploadImage(src, `artists/${slug}`);
    if (url) galleryUrls.push({ src, url });
  }

  if (DRY_RUN) {
    console.log(`  (dry run — skipping DB writes)`);
    return;
  }

  const placeholderEmail = `${slug}@placeholder.arthere.local`;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: placeholderEmail },
      update: { name: parsed.name },
      create: { email: placeholderEmail, name: parsed.name },
    });

    const artist = await tx.artist.upsert({
      where: { slug },
      update: {
        name: parsed.name,
        bio: parsed.bio || null,
        bioPhotoUrl,
        heroImageUrl,
        website: parsed.website,
        instagram: parsed.instagram,
      },
      create: {
        userId: user.id,
        slug,
        name: parsed.name,
        bio: parsed.bio || null,
        bioPhotoUrl,
        heroImageUrl,
        website: parsed.website,
        instagram: parsed.instagram,
      },
    });

    // Replace gallery images so re-runs stay in sync
    await tx.artworkImage.deleteMany({ where: { artistId: artist.id } });
    for (let i = 0; i < galleryUrls.length; i++) {
      await tx.artworkImage.create({
        data: {
          artistId: artist.id,
          url: galleryUrls[i].url,
          sortOrder: i,
          isHero: false,
        },
      });
    }

    // Best-effort Place links (only for community items pointing at a Place page)
    await tx.artistPlace.deleteMany({ where: { artistId: artist.id } });
    for (const item of parsed.community) {
      if (!item.placeSlug) continue;
      const place = await tx.place.upsert({
        where: { slug: item.placeSlug },
        update: {},
        create: { slug: item.placeSlug, name: item.name },
      });
      await tx.artistPlace.create({
        data: { artistId: artist.id, placeId: place.id, relationship: "MEMBER" },
      });
    }

    return artist;
  });

  console.log(`  ✓ upserted Artist ${result.id} with ${galleryUrls.length} gallery image(s)`);
}

async function main() {
  console.log(`Seeding ${ARTIST_SLUGS.length} artist(s)${DRY_RUN ? " [DRY RUN — no uploads/writes]" : ""}...`);
  console.log(`Blob auth: ${DRY_RUN ? "n/a" : hasRwToken ? "BLOB_READ_WRITE_TOKEN" : "OIDC token + BLOB_STORE_ID"}`);

  for (const slug of ARTIST_SLUGS) {
    await seedArtist(slug);
  }

  if (prisma) await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch(async (err) => {
  console.error("\n✗ Seed failed:", err);
  if (prisma) await prisma.$disconnect();
  process.exit(1);
});
