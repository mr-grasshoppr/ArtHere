# One-off scripts — READ BEFORE RUNNING

Single-use import, crop, and seed scripts kept for reference. Each was run
once against production data (specific artists, places, or images).

**They mutate the production database and/or overwrite images in Blob
storage.** Several use `allowOverwrite` or resize-in-place, and in the past
that **destroyed original images** — e.g. the full-resolution Art in the
Village mural was cropped to a thin strip and the original was lost.

## They are guarded

Every script here refuses to run unless you opt in:

```bash
RUN_ONE_OFF=1 npx tsx scripts/one-off/<script>.ts
RUN_ONE_OFF=1 node scripts/one-off/<script>.mjs
```

Before running any of them, know exactly what path/record it overwrites.
There is a dated full backup of all images at `~/ArtHere-image-backups/` on
the founder's machine, plus `blob-manifest.json` at the app root indexing
everything in storage.

## Originals are now preserved automatically

Every upload through the app (`/api/upload`, `/api/admin/upload`,
`/api/admin/upload/blob`) also writes the **raw, unprocessed file** to an
immutable `originals/…` path in Blob (unique suffix, never overwritten). That
archive is the source of truth — nothing reads from it at runtime; it exists
so no contribution's original is ever lost again. Do **not** add scripts that
overwrite display images without preserving the original first.

## Reusable scripts (one level up in `scripts/`)

- `seed-portland.mjs` — seeds the Portland city record
- `test-blob-upload.mjs` — verifies Vercel Blob credentials end-to-end
- `merge-env.py` — fallback for merging `.env.local` after a destructive
  `vercel env pull` (see `CLAUDE.md`)
