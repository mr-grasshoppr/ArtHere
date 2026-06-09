# Claude Code notes — arthere-app

## Stack & project layout

- **Next.js 16 / React 19 / TypeScript / Tailwind 4**, with **Prisma 5 +
  PostgreSQL (Neon)**, **NextAuth (Auth.js v5 beta)** w/ email magic links,
  **Vercel Blob** for image storage, and **Claude (Anthropic SDK)** for
  AI image tagging.
- This app lives in `arthere-app/` inside the `ArtHere` repo, which otherwise
  contains a separate static HTML/CSS/JS site (unrelated to this Next app).
- **The Next.js app's work is on the `prototype` git branch — not `main`.**
  If files like `package.json`/`prisma/`/`src/lib` appear to be "missing",
  check `git branch` / `git status` before assuming data loss — it's probably
  just a branch mismatch (`git checkout prototype`).
- Vercel project: `arthere-app` (org `mr-grasshopprs-projects`). Linked via
  `.vercel/project.json`. Postgres is a **Neon** database, connected to the
  Vercel project through the Neon integration (Storage tab).

## Env files: `.env` vs `.env.local`

- **Next.js** (the app, `next dev`/`next build`) auto-loads `.env.local`
  (overrides `.env`).
- **Prisma CLI** (`prisma migrate`, `prisma studio`, etc.) loads `.env` only —
  via `import "dotenv/config"` in `prisma.config.ts`. It does **not** read
  `.env.local`.
- ⚠️ Keep `DATABASE_URL`/`DATABASE_URL_UNPOOLED` in sync across **both** files,
  or Prisma CLI commands will silently use stale/stub values from `.env` while
  the running app uses the real ones from `.env.local`.

## `vercel env pull` overwrites the whole file — RESOLVED by syncing everything to Vercel

`npx vercel env pull .env.local` **replaces the entire file** with only the
vars Vercel knows about for that environment. Early on, several "local-only"
vars (`ANTHROPIC_API_KEY`, `AUTH_SECRET`, `EMAIL_FROM`, `EMAIL_SERVER`,
`NEXTAUTH_URL`) lived only in `.env.local` and NOT in Vercel — so every pull
(and even side-effect pulls triggered by `vercel blob create-store` /
`delete-store`!) silently wiped them out. This happened repeatedly.

**Fix that worked — push everything to Vercel's `development` environment:**
```bash
export PATH="/opt/homebrew/bin:$PATH"
printf '%s' "<value>" | npx vercel env add ANTHROPIC_API_KEY development --yes
# ...repeat for AUTH_SECRET, EMAIL_SERVER, EMAIL_FROM, NEXTAUTH_URL
```
(Pipe values via stdin — never echo secrets to stdout/transcript.)

Once every var the app needs locally is registered in Vercel's `development`
environment, `vercel env pull .env.local` becomes a **safe, idempotent**
operation — it won't drop anything. Verified: pulled before/after, key count
stayed at 25, only `VERCEL_OIDC_TOKEN` (which rotates) changed.

**Going forward:** whenever you add a new local-only env var the app needs,
also register it in Vercel (`vercel env add <KEY> development`) so it stays
in sync and survives future pulls. `scripts/merge-env.py` still exists as a
fallback for one-off merges if you ever end up with vars that *shouldn't*
live in Vercel.

## Vercel Blob auth: OIDC vs static token — RESOLVED

The `@vercel/blob` SDK (v2.4.0) can authenticate two ways:
1. **OIDC**: `VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID` — only works for
   environments the Blob store is *connected* to.
2. **Static token**: `BLOB_READ_WRITE_TOKEN` — works regardless of environment
   scoping.

**What happened:** the first Blob store was connected only to
Production/Preview (not Development), causing
`BlobOidcEnvironmentNotAllowedError` for local scripts/CLI. There was no
obvious dashboard UI to add Development to an existing connection.

**Fix that worked:** delete the (empty) store and recreate it explicitly
connected to all three environments:
```bash
npx vercel blob delete-store <store-id> --yes
npx vercel blob create-store arthere-app-blob --access public \
  --environment production --environment preview --environment development --yes
```
This time Vercel provisioned a **static `BLOB_READ_WRITE_TOKEN`** (scoped to
all environments) instead of relying on OIDC — which sidesteps the
environment-scoping problem entirely. Verified working end-to-end with
`scripts/test-blob-upload.mjs`.

⚠️ **Both `delete-store` and `create-store` silently ran their own
`vercel env pull`, overwriting `.env.local`** (same destructive-overwrite
behavior as `vercel env pull` itself — see above). Local-only vars
(`ANTHROPIC_API_KEY`, `AUTH_SECRET`, `EMAIL_*`, `NEXTAUTH_URL`) were wiped
both times and had to be restored from a pre-made backup. **Always snapshot
`.env.local` before running any `vercel blob create-store` / `delete-store`
/ `env pull` command:**
```bash
cp .env.local .env.local.bak-$(date +%s)
```

## Node/npm/npx not found in Bash tool sessions

**Symptom:** Running `node`, `npm`, or `npx` in a Bash tool call fails with
`command not found`, even though they work fine in the user's interactive
terminal.

**Cause:** Node.js is installed via Homebrew at `/opt/homebrew/bin/` (Cellar
path: `/opt/homebrew/Cellar/node/<version>/bin/`). The user's `~/.zprofile`
loads it via `eval "$(/opt/homebrew/bin/brew shellenv zsh)"`, which only runs
for interactive zsh login shells. The Bash tool runs non-interactive `bash`
sessions that never source `~/.zprofile` or `~/.zshrc`, so `/opt/homebrew/bin`
is missing from `PATH`.

**Fix:** Prepend the Homebrew bin directory to `PATH` for any command that
needs Node tooling:

```bash
export PATH="/opt/homebrew/bin:$PATH" && <your command here>
```

Example:
```bash
export PATH="/opt/homebrew/bin:$PATH" && cd arthere-app && npm run dev
```

This does **not** require any changes to the user's shell config — it's purely
a per-invocation fix for the agent's non-interactive shell.

## Verifying it worked
```bash
export PATH="/opt/homebrew/bin:$PATH" && node -v && npm -v && npx --version
```
Should print versions (e.g. `v26.0.0`, `11.x.x`, `11.x.x`) instead of
`command not found`.
