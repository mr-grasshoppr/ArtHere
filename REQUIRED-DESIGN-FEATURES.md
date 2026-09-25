# REQUIRED DESIGN FEATURES

Design decisions on this site that are **requirements, not preferences**.
They are easy to break by accident from a change that looks unrelated — and
they have been, repeatedly — so each one is written down here with the code
that implements it and the test that fails when it regresses.

## How to use this file

**Check every change to the site against this list before shipping it.** Not
only changes that look like layout work: every rule below was broken by a
change that looked like something else (image sizing, filter behaviour, a
per-artist cap).

1. Read the rules. If a change touches anything a rule names, say how the
   change keeps the rule.
2. Run the guard tests: `cd arthere-app && npm test`. CI runs them on every
   push and pull request (`.github/workflows/ci.yml`).
3. If a rule genuinely needs to change, change **this file and its test in
   the same commit**, deliberately. Silent drift is the failure mode this
   file exists to stop.

---

## GRID — the artwork and city grid views

The city page's grid (`CityGrid`, driven by `CityArtworkView` — the city
page and the artwork browser are one page) tiles the same images repeatedly. What makes them read
as a designed surface rather than as a bug is that a visitor never catches
the same thing twice in one glance.

**Implemented by**
- [`arthere-app/src/lib/grid-design.ts`](arthere-app/src/lib/grid-design.ts) — the numbers, in one place
- [`arthere-app/src/lib/grid-sequence.ts`](arthere-app/src/lib/grid-sequence.ts) — the pool builder and the placement planner
- [`arthere-app/src/components/CityGrid.tsx`](arthere-app/src/components/CityGrid.tsx)
- [`arthere-app/src/components/CityArtworkView.tsx`](arthere-app/src/components/CityArtworkView.tsx)

**Guarded by**
[`arthere-app/src/lib/__tests__/required-design-features.test.ts`](arthere-app/src/lib/__tests__/required-design-features.test.ts),
which re-simulates the browser's real `grid-auto-flow: row dense` placement —
row spans, the city page's 2×2 logo cell and all — and asserts the rules
against the rows that actually result. It does not take the planner's word
for where anything lands.

### The rules

| | Rule |
|---|---|
| **GRID-1** | The spacing rule is **four clear rows** — a row gap of 5. `GRID_MIN_ROW_GAP` is pinned to 5 by test. |
| **GRID-2** | **The same artwork never appears twice in one row.** |
| **GRID-3** | **No artist has two pieces in one row** — not two copies of one piece, and not two different pieces either. |
| **GRID-4** | **The same artwork stays four rows clear of itself.** |
| **GRID-5** | **An artist's work stays four rows clear of itself** — and where a city is too small for four, as many rows clear as it can fill: three, then two, then one. See the ladder below. |
| **GRID-6** | Ambient grids end on a **flush bottom edge**; a **filtered** result set is never padded — every match appears exactly once. |
| **GRID-7** | The city page's logo cell is planned as the **2 cols × 2 rows** tile it renders as. |
| **GRID-8** | The logo cell's artwork is **drawn at random** across artists — never defaulted to whoever has the most pieces. |
| **GRID-10** | **Every artist gets the same amount of the grid.** An ambient grid shows each artist the same number of times, whatever the size of their portfolio; a deeper portfolio means a different selection each visit, not more tiles. |
| **GRID-9** | **A tile shows the artwork, not the mat.** When an image carries a white border (a photographed mat, scan margins, an export with a white frame), the tile crops tighter — to the piece — and the piece sits centred in the cell. |

### Every artist gets the same amount of the grid (GRID-10)

The pool an ambient grid draws from gives every artist the **same number of
appearances**: `GRID_REPEATS` turns through the work of whichever artist has
the least of it. An artist with more pieces than that spends the same budget
on a random selection of theirs, redrawn on every visit — so the whole of
their work reaches the grid across visits, without any of it taking up more
of one visit than anyone else's.

This is not only a fairness rule, it is load-bearing for the spacing rules
above. Repeating each *piece* a fixed number of times instead — which is what
the grid did until this was written down — hands an artist with twice the
portfolio twice the tiles, and a pool that drains unevenly ends in a block of
whoever is left. That is what the last rows of Portland's grid were: three
Becky Chinn pieces in one row, eight of fourteen tiles on screen hers, with
the rest of the grid perfectly well behaved.

**Implemented by** `buildGridPool` and `artistAppearanceBudget`. A filtered
view is a result set, not texture, so it is exempt: every match once (GRID-6).

### What "four rows clear" can and cannot promise

A row holds `cols` tiles, so a window of 5 rows holds about `5 × cols` of
them. Full separation is only possible when there is that much distinct
material to draw from — with 8 artists on a 4-column grid, no arrangement
keeps every artist 5 rows from themselves, because there simply aren't
enough of them to fill the gap.

**When four clear rows can't be had, the grid takes the most it can — three
clear rows, then two, then one — rather than giving up on spacing.** The
planner aims each piece at the spacing its remaining turns can afford, keeps
the best of many attempts, and finishes with a repair pass that trades tiles
between distant rows. The two same-row rules are absolute and are never
traded for anything: they outrank the budget in GRID-10, and the planner will
spend an extra appearance on someone else's work rather than put an artist
beside themselves. The order of defence is

1. same artwork in one row — never;
2. same artist in one row — never;
3. same artwork within four rows, else as far as it can;
4. same artist within four rows, else as far as it can.

Artwork is defended ahead of artist on purpose: a visitor notices *that exact
picture again* far more readily than *another piece by the same person*.

**The ladder the test holds the planner to** (rows apart between two pieces
by one artist; "5 apart" is four clear rows). These are *measured* floors,
not arithmetic — the numbers come from running the planner over lopsided
rosters (2–6 pieces each, one artist with double) and taking the worst
result, with a step of margin. A real city usually lands a row above its
floor.

| Guaranteed separation | Artists, 4-column grid (desktop) | Artists, 3-column grid (phone) |
|---|---|---|
| nothing beyond the same-row rules | up to 4 | up to 3 |
| never on adjacent rows (1 apart) | 5–10 | 5–6 |
| 1 clear row (2 apart) | 11 | 7–8 |
| 2 clear rows (3 apart) | 12–14 | 9–10 |
| 3 clear rows (4 apart) | 15–17 | 11–13 |
| **4 clear rows (5 apart)** | 18+ | 14+ |

The same-artwork rule, GRID-4, holds at four clear rows once the city has
`cols + 2` artists and `cols × 3` distinct pieces, and at `distinct
pieces / cols` below that. Both rules are also bounded by simple capacity: a
piece that appears `k` times in a grid `R` rows deep cannot be more than
`R / k` rows from itself, and the test asserts the lower of the two.

**Filtered views** are the exception to the ladder. A result set is whatever
matched: if one artist owns a third of the matches they are on screen a third
of the time, and no ordering changes that. The same-row rules still hold.

Portland (16 artists) sits at 3 clear rows on desktop and 4 on phones, and
its grid shows every artist nine times. A city on its first few sign-ups is
tighter, and the tests encode that rather than papering over it.

### Things that have quietly broken these rules before

Every one of these was a real regression:

- **Spacing keyed on the artist only.** The same *image* could then reappear
  two rows later, because the planner considered it the same as any other
  piece by that artist. Tiles now carry two identities — `key` (artist) and
  `id` (the piece) — and both are spaced.
- **The logo cell not being modelled.** `CityGrid` renders `sequence[0]` as a
  2-col × 2-row cell. While the planner treated it as an ordinary one-column
  tile, every row boundary below it was off, and the spacing was calculated
  against rows the browser never produced.
- **Measuring from the last placement only.** Dense flow back-fills holes, so
  a tile placed later can land *above* one placed earlier. Distance is
  measured to the nearest occupied block in **both** directions.
- **Padding stealing from the pool.** The tiles added to square off the
  bottom edge fill holes, and holes sit early in the grid. When they spent
  the pool's budget, later slots were left with a tall piece for a one-row
  cell — which renders at the wrong height and drags the whole layout out of
  step with the geometry it was planned against.
- **Repeating each piece rather than each artist.** See GRID-10 above. The
  guard tests missed it for months because every roster they built gave each
  artist the same number of pieces — the one shape in which the bug cannot
  appear. They now build lopsided rosters, and they build them through the
  same `buildGridPool` the site uses, rather than assembling a pool of their
  own that no page ever renders.
- **Shuffling the row-spans.** A plain shuffle regularly drops a knot of tall
  cells into the last rows, where too few distinct pieces remain to fill
  them. Spans are now spread evenly through the sequence.

### Crop white borders out of artwork tiles (GRID-9)

An artwork tile that shows a white mat as well as the piece reads as a bug:
the art floats off-centre inside a white box, and a dark drawing on white
paper turns into a white cell with something small in the middle. Whenever
there is a white background around a piece of art, the tile crops tighter.

**Implemented by**
- [`arthere-app/src/lib/image-border.ts`](arthere-app/src/lib/image-border.ts)
  — finds the near-white margin on each side and converts it into a focal
  point + zoom that keeps the tile's window inside the artwork for **any**
  cell shape. The original file is never rewritten; only the framing changes.
- [`arthere-app/src/lib/image-focus.ts`](arthere-app/src/lib/image-focus.ts)
  `detectFocus` — runs on every upload after the vision model picks the
  focal point. A border, when found, wins; the vision point still steers any
  axis that has no border.
- [`arthere-app/scripts/trim-white-borders.mts`](arthere-app/scripts/trim-white-borders.mts)
  — backfill for images that were uploaded before this existed. Run it after
  any bulk import.

**Rules of thumb**
- Borders under 1.5% of a side are ignored (keylines, anti-aliasing).
- Zoom is capped at 2.5× so a small piece on a large sheet doesn't become a
  blurry tile; in that case some mat stays visible, which is the lesser evil.
- A **manual** framing (`ImageFocus.manual`) is never overwritten by the
  detector. If a manually framed tile still shows a mat, re-frame it or run
  the backfill with `--force` for that image.
- Only white/near-white borders are trimmed. A dark or coloured border is
  part of the picture until someone says otherwise.

### If you change any of this

- Both grids must plan against the **column count actually in effect** (3
  below the breakpoint, 4 above it). Planning for the wrong one throws every
  row boundary off.
- Any cell that renders at a size other than one column by one row must be
  declared to the planner (`span`, or `leadCell` for the first tile).
- Changing image sizes, `sizes`/`quality` attributes, or lazy-loading is
  fine and touches none of this — but re-run the tests anyway. That is the
  category of change that broke it last time.

---

## LOGO — the Art Here brand mark

**Implemented by** — there are **two independent source assets** for this
wordmark, which is itself a known inconsistency (see "Two wordmark shapes"
below):
- [`arthere-app/public/images/arthere_color_logo_update_Sept1.png`](arthere-app/public/images/arthere_color_logo_update_Sept1.png) — the current colored (pink/green) master, wider letter spacing, used only as the source for the email logo (see `EmailLayout.tsx`'s comment)
- [`arthere-app/public/images/arthere_logo_green_pink.png`](arthere-app/public/images/arthere_logo_green_pink.png) — the **superseded** colored master (tight letter spacing); no longer referenced by code, kept for history
- [`arthere-app/public/images/arthere-logo-dark.png`](arthere-app/public/images/arthere-logo-dark.png) / [`arthere-logo-white.png`](arthere-app/public/images/arthere-logo-white.png) — solid monochrome derivatives of the **old, tight-spacing** shape, rendered directly by [`NavBarClient.tsx`](arthere-app/src/components/NavBarClient.tsx) and [`LoginPageClient.tsx`](arthere-app/src/app/login/LoginPageClient.tsx)
- [`arthere-app/public/images/arthere-mask.png`](arthere-app/public/images/arthere-mask.png) — a CSS mask-image of the same **old, tight-spacing** shape (rasterized from `arthere_logo_website_Aug7.svg`), used by [`AnimatedLogoMask.tsx`](arthere-app/src/components/AnimatedLogoMask.tsx) for the animated hero on the homepage and login page
- [`arthere-app/src/emails/EmailLayout.tsx`](arthere-app/src/emails/EmailLayout.tsx) — renders a **separately generated** email-specific derivative of the new-spacing master, not any of the site assets above

### Two wordmark shapes — known inconsistency, not yet resolved

As of the Sept 1 2026 art update, the email logo and the on-site logo are
**different shapes** — the email version has wider letter spacing; the
NavBar/login solid logos and the animated hero mask still use the old,
tighter spacing, because they're derived from a different source file that
was not regenerated. Regenerating them isn't a simple recolor: `arthere-mask.png`
backs `AnimatedLogoMask.tsx`'s CSS mask, and other commits (e.g. "Scale logo
credit text with the mask's own rendered size") show positioning elsewhere
has been tuned against this exact shape's proportions — swapping it risks a
visual regression in the animated hero, not just a shape update. Whoever
resolves this should regenerate `arthere-logo-dark.png`, `arthere-logo-white.png`,
and `arthere-mask.png` (and its SVG source) from the new artwork's silhouette,
then re-check the hero animation and credit-text positioning on both the
homepage and login page before calling it done.

**Guarded by:** nothing automated yet. Email-client dark-mode image handling
can't be simulated in CI — verifying this means actually sending a test email
and opening it in at least Gmail (Android/iOS, dark mode) and Apple Mail
(dark mode).

### The rule

**LOGO-1.** The logo must never render as a stray colored rectangle against
a mismatched background, on the site or in an email, in light mode or dark.

- **On the site** (NavBar, login, animated hero) this is already satisfied:
  the dark/white logo PNGs and the mask PNG are all transparent, and every
  context they render in controls its own background via CSS or a solid
  `backgroundColor` behind the mask, so a transparent PNG is simply correct.
  If a change ever flattens one of these onto a solid color, that's a
  regression — they must stay transparent.
- **In email** this is *not* simply "make it transparent" without thought —
  it already went wrong once. A genuinely transparent PNG in the email logo
  was tried, then reverted in commit `400f0f2`, because Gmail's dark-mode
  image handling reportedly put a visible dark halo around the transparent
  PNG's anti-aliased edges. The fix at the time — compositing the logo onto
  opaque white — traded that halo for a different defect: the logo rendered
  as a plain white box in dark-mode email clients that don't share Gmail's
  specific quirk, which is exactly the "white bg... looks like shite on a
  dark screen" complaint this rule exists to stop from recurring again.

### Current state — v5, pending live verification

As of the `arthere-logo-email-color-v5.png` asset (referenced from
`EmailLayout.tsx`), the email logo is genuinely transparent — resized from
`arthere_color_logo_update_Sept1.png` with sharp (lanczos3) to 240px (3x
the 80px display size), alpha channel intact, not flattened onto any color.
v3 first restored transparency but shipped at 480px/146KB, slow enough on
some connections that the logo visibly flashed a broken-image icon before
popping in — v4/v5 cut that to 240px/~58KB. v5 also switched the source art
to the wider-letter-spacing wordmark (see "Two wordmark shapes" above).
This directly fixes the white-box complaint, and composites cleanly with no
visible fringe when checked locally. **What it does not do is confirm the
original Gmail dark-mode halo won't reappear** — that can only be seen in a
real Gmail dark-mode render, which nothing in this repo or CI can simulate.

- **If a live check in Gmail dark mode looks clean:** the halo in `400f0f2`
  was likely a symptom of that specific export (bad edge matting), not an
  unconditional Gmail limitation. Update this section to say so, and this
  rule is simply "the email logo must be a transparent PNG" from here on.
- **If the dark halo reappears:** do not reflexively flatten it back onto
  opaque white — that's the v2 mistake, and the white-box complaint is worse
  than the halo. Instead, either give the mark a deliberate small backing
  (e.g. a rounded card) so the background reads as designed in both modes,
  or ship a light/dark pair of the asset swapped via a
  `prefers-color-scheme: dark` media query in the email's `<style>` (with
  the `color-scheme`/`supported-color-schemes` meta tags Gmail and Apple
  Mail look for).

Whichever state this ends up in, it must be confirmed against a real,
received email — this file existing hasn't stopped this from breaking
twice already; only actually checking the rendered email will.

---

## PALETTE — the brand colors

Three colors, taken from the statement-band artwork. Use these hex values
verbatim for anything brand-colored; do not sample them off a screenshot or
off the artwork, which is soft-edged and will give a different value
depending on where the dropper lands.

| Name | Hex | Where it comes from |
| --- | --- | --- |
| **pink** | `#f96a9b` | the band's right-hand wash; also the logo's pink |
| **green** | `#07b26b` | the band's left-hand wash; also the logo's green |
| **chartreuse** | `#bdd349` | the band's yellow-green corner |

**Implemented by** — nothing yet as CSS tokens. The only place these colors
appear on the site today is the artwork itself:
[`arthere-app/public/images/pink_green_section_v3.png`](arthere-app/public/images/pink_green_section_v3.png)
(the homepage statement band, via `StatementBand.module.css`) and the color
logo masters listed under LOGO above.

### The rule

**PALETTE-1.** New brand-colored UI uses these three values, not
approximations of them. If a second component needs one, define them as
tokens under `@theme inline` in
[`arthere-app/src/app/globals.css`](arthere-app/src/app/globals.css) rather
than repeating the literals.

The site's neutrals are a separate, already-settled set and are not affected
by this: `#1a1a1a` (near-black text and dark sections), `#0a0a0a` (the city
pages' black), `#f7f6f3` (the light section background), `#dedad4` (borders,
and the US map's outline).

**Guarded by:** nothing automated. These are values to reach for, not an
invariant a test can check.
