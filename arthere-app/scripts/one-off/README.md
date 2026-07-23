# One-off scripts (historical)

Single-use import, crop, and seed scripts kept for reference. Each was run
once against production data (specific artists, places, or images) and is
not expected to run again — several reference Blob URLs or database rows
that may no longer exist.

Reusable scripts live one level up in `scripts/`:

- `seed-portland.mjs` — seeds the Portland city record
- `test-blob-upload.mjs` — verifies Vercel Blob credentials end-to-end
- `merge-env.py` — fallback for merging `.env.local` after a destructive
  `vercel env pull` (see `CLAUDE.md`)
