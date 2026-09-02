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

The city page background (`CityGrid`) and the `/artwork` browser
(`ArtworkBrowser`) both tile the same images repeatedly. What makes them read
as a designed surface rather than as a bug is that a visitor never catches
the same thing twice in one glance.

**Implemented by**
- [`arthere-app/src/lib/grid-design.ts`](arthere-app/src/lib/grid-design.ts) — the numbers, in one place
- [`arthere-app/src/lib/grid-sequence.ts`](arthere-app/src/lib/grid-sequence.ts) — the placement planner
- [`arthere-app/src/components/CityGrid.tsx`](arthere-app/src/components/CityGrid.tsx)
- [`arthere-app/src/components/ArtworkBrowser.tsx`](arthere-app/src/components/ArtworkBrowser.tsx)

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
| **GRID-5** | **An artist's work stays four rows clear of itself.** |
| **GRID-6** | Ambient grids end on a **flush bottom edge**; a **filtered** result set is never padded — every match appears exactly once. |
| **GRID-7** | The city page's logo cell is planned as the **2 cols × 2 rows** tile it renders as. |

### What "four rows clear" can and cannot promise

A row holds `cols` tiles, so a window of 5 rows holds about `5 × cols` of
them. Full separation is only possible when there is that much distinct
material to draw from — with 8 artists on a 4-column grid, no arrangement
keeps every artist 5 rows from themselves, because there simply aren't
enough of them to fill the gap.

So the rules degrade in a **defined order**, and the planner defends them in
this sequence:

1. same artwork in one row — never;
2. same artist in one row — never;
3. same artwork within four rows;
4. same artist within four rows.

Artwork is defended ahead of artist on purpose: a visitor notices *that exact
picture again* far more readily than *another piece by the same person*.

Measured guarantees, as the test asserts them:

- **GRID-2** holds whenever there are at least `cols` distinct pieces.
- **GRID-3** holds whenever the city has **more artists than the grid has
  columns**. At exactly `cols` artists every row must contain every artist
  once, and a single tall hero cell makes that unsatisfiable.
- **GRID-4** holds at `min(5, distinct pieces / cols)` once the city has at
  least `cols + 2` artists and `cols × 3` distinct pieces. Below that,
  GRID-2 is the guarantee.
- **GRID-5** holds at `min(5, artists / cols)` once the city has about three
  artists per column. Below that, GRID-3 is the guarantee.

Portland is comfortably past all of these thresholds. A city on its first few
sign-ups is not, and its grid will be visibly tighter until it fills out.
That is expected, and the tests encode it rather than papering over it.

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
- **Shuffling the row-spans.** A plain shuffle regularly drops a knot of tall
  cells into the last rows, where too few distinct pieces remain to fill
  them. Spans are now spread evenly through the sequence.

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

**Implemented by**
- [`arthere-app/public/images/arthere_logo_green_pink.png`](arthere-app/public/images/arthere_logo_green_pink.png) — the master asset, a transparent PNG
- [`arthere-app/src/components/NavBarClient.tsx`](arthere-app/src/components/NavBarClient.tsx) — renders the master asset directly
- [`arthere-app/src/app/login/LoginPageClient.tsx`](arthere-app/src/app/login/LoginPageClient.tsx) — renders the master asset directly
- [`arthere-app/src/emails/EmailLayout.tsx`](arthere-app/src/emails/EmailLayout.tsx) — renders a **separately generated** email-specific derivative, not the master asset

**Guarded by:** nothing automated yet. Email-client dark-mode image handling
can't be simulated in CI — verifying this means actually sending a test email
and opening it in at least Gmail (Android/iOS, dark mode) and Apple Mail
(dark mode).

### The rule

**LOGO-1.** The logo must never render as a stray colored rectangle against
a mismatched background, on the site or in an email, in light mode or dark.

- **On the site** (NavBar, login) this is already satisfied: the master PNG
  is transparent, and every context it renders in controls its own
  background via CSS, so a transparent PNG is simply correct. If a change
  ever flattens the master asset onto a solid color, that's a regression —
  the master asset must stay transparent.
- **In email** this is *not* simply "make it transparent" without thought —
  it already went wrong once. A genuinely transparent PNG in the email logo
  was tried, then reverted in commit `400f0f2`, because Gmail's dark-mode
  image handling reportedly put a visible dark halo around the transparent
  PNG's anti-aliased edges. The fix at the time — compositing the logo onto
  opaque white — traded that halo for a different defect: the logo rendered
  as a plain white box in dark-mode email clients that don't share Gmail's
  specific quirk, which is exactly the "white bg... looks like shite on a
  dark screen" complaint this rule exists to stop from recurring again.

### Current state — v3, pending live verification

As of the `arthere-logo-email-color-v3.png` asset (referenced from
`EmailLayout.tsx`), the email logo is genuinely transparent again — resized
from the master PNG with sharp (lanczos3), alpha channel intact, not
flattened onto any color. This directly fixes the white-box complaint, and
composites cleanly with no visible fringe when checked locally. **What it
does not do is confirm the original Gmail dark-mode halo won't reappear** —
that can only be seen in a real Gmail dark-mode render, which nothing in
this repo or CI can simulate.

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
