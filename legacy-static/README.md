# Legacy static site (retired)

This is the original Art Here prototype: a plain HTML/CSS/JS site that was
hosted on GitHub Pages at artishere.org through mid-2026. It was replaced by
the Next.js app in `../arthere-app/`, which now serves artishere.org via
Vercel.

Kept for reference only — nothing here is deployed, and content (artist
pages, places, survey copy) is frozen at the point of retirement. The last
commit where these files lived at the repo root is tagged
`static-site-final`.

Contents:

- `index.html`, `styles.css`, `js/` — home page and shared assets
- `pages/` — Portland city page, artists/artwork/community/network listings,
  about, survey
- `artists/`, `places/` — individual profile pages (one HTML file each)
- `images/` — all site imagery (the app keeps its own copies in
  `arthere-app/public/images/`)
- `CNAME` — the old GitHub Pages domain binding
- `CLAUDE_CODE_HANDOFF.md`, `DESIGN_SOURCE_OF_TRUTH.md` — design docs from
  the static-site era; describe this prototype, not the app
