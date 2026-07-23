# Art Here

A community initiative that makes local creative communities visible and
economically connected, city by city. Portland, OR is the pilot; Biloxi, MS
and San Jose, CA are planned next.

Art Here is a project of [Art Experience Lab](https://axlab.io). Live at
**[artishere.org](https://artishere.org)**.

## Repository layout

```
arthere-app/     The website — Next.js 16 / React 19 / TypeScript / Tailwind 4,
                 Prisma + Postgres (Neon), NextAuth magic links (via Resend),
                 Vercel Blob image storage, Claude for artwork tagging & search.
                 Deployed to Vercel (project: arthere-app) at artishere.org.
docs/            Survey design documents.
legacy-static/   The retired 2026 static-site prototype (see its README).
.github/         CI: typecheck, lint, unit tests, build on every push/PR.
```

## Working on the app

```bash
cd arthere-app
npm install
npx prisma generate
npm run dev
```

Environment variables: copy `arthere-app/.env.example` to
`arthere-app/.env.local` and fill in real values. Keep `DATABASE_URL` /
`DATABASE_URL_UNPOOLED` in sync with `arthere-app/.env` too — the Prisma CLI
reads only `.env`. See `arthere-app/CLAUDE.md` for the full env-file gotchas.

Useful commands (from `arthere-app/`):

```bash
npm run dev          # local dev server
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest unit tests
npm run build        # production build (runs prisma generate first)
npm run studio       # prisma studio
```

## Database migrations

Migrations live in `arthere-app/prisma/migrations`. After changing
`schema.prisma`:

```bash
npx prisma migrate deploy
```

must run against the Neon database **before** deploying app code that
depends on the new columns.

## Deploying

Production deploys go to the `arthere-app` Vercel project:

```bash
vercel deploy --prod
```

Run this from the **repo root** (not `arthere-app/`) — the Vercel project's
root-directory setting expects it.
