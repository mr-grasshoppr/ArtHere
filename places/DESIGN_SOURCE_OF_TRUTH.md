# Art Here — Design Source of Truth

Last updated: May 23, 2026

This document describes the intended design of every page. When we make changes, we update BOTH this document and the code so they always agree.

---

## Global / Shared Elements

### Brand assets (in `images/`)
- **`arthere-mask.png`** — The Art Here logo as a CSS mask. White letterforms = opaque (show through), black = transparent. Source: `artherelogo_FINAL_FINAL.png`. Dimensions 1668×1457 (ratio 1.15). Layout: ART on top row (A | RT), HERE on bottom row (HE | RE).
- **`arthere-logo-white.png`** — White letterforms on transparent background. Used in nav on DARK backgrounds.
- **`arthere-logo-dark.png`** — Black letterforms on transparent background. Used in nav on LIGHT/WHITE backgrounds.
- **`ArtHere_favicon.png`** — The "A" triangle favicon. Source: `ArtHereFavicon_FINAL_FINAL.png`. Referenced by every page.
- **`arthere-mask-left.png`** / **`arthere-mask-right.png`** — The two halves of the logo (A/HE and RT/RE), each cropped square, used as masks for the two logo squares on the Portland grid. Sources: `artherelogo_FINAL_FINAL_leftside.png` / `_rightside.png`.

### Fonts
- Body text: **Inter** (300/400/500/600)
- Display headers, logos, place/artist names, city labels: **Nunito** (600/700), fallback `'Arial Rounded MT Bold', Arial, sans-serif`

### Navigation (universal rule)
- **No pinned/sticky full-width nav bar with text links** anywhere.
- Every page has, in the top-left: the **Art Here logo** (links to home `index.html`) + a **pancake menu** button.
- Pancake menu is a **dropdown** (not a side panel), containing in order: **Join Us** (→ survey), **About**, **Contact**.
- On Portland-scoped pages (Portland city page, artists, community, individual artist/place pages, network), the word **"Portland"** appears to the right of the pancake in Nunito, and links back to the Portland city page (`portland.html`).
- **Light pages** (white bg): logo = dark version, Portland text = black, pancake lines = black.
- **Dark pages** (black bg): logo = white version, Portland text = white, pancake lines = white.
- A solid color bar (56px tall) sits behind the nav so the logo + text are always legible while scrolling. White bar on light pages, black bar on dark pages.

### Footer
- Light pages: "© 2026 Art Here · A project of Art Experience Lab"

---

## Home Page (`index.html`)
- **Background:** white.
- **Top-left:** pancake dropdown menu (Join Us / About / Contact). No logo in the corner here (the big logo IS the page).
- **Cities list:** stacked tightly in the top-left, just under the pancake. "Portland, OR" (live, with arrow →), "Biloxi, MS" (grayed, "coming soon"), "San Jose, CA" (grayed, "coming soon").
- **Center:** large Art Here logo as a mask window (`min(60vw, 520px)`, aspect ratio 3523/2690). Artwork images slide horizontally behind the logo cutouts (animated). On mobile the logo is `min(85vw, 380px)`.
- **Footer** at the bottom.

---

## Portland City Page (`pages/portland.html`)
- **Background:** full black, `overflow: hidden` (no page scroll).
- **Top bar:** solid black, 56px. White Art Here logo (→ home), pancake dropdown, "Portland" in white (→ portland.html).
- **Bottom bar:** solid black, 56px, centered links: **artwork · artists · community · network**.
  - artwork → toggles grid mode (see below)
  - artists → `artists.html`
  - community → `community.html`
  - network → `network.html`
- **The grid (between the bars):** a grid of artwork images, all same column width, 4 columns desktop / 3 columns mobile, 5px gaps, 6px rounded corners.
  - **Logo placement:** The Art Here logo occupies **two adjacent square cells in a single row** (NOT 2×2). LEFT square uses `arthere-mask-left.png` (the A over HE half); RIGHT square uses `arthere-mask-right.png` (the RT over RE half). The gap between the two squares falls in the natural split between A|RT (top) and HE|RE (bottom). Real **artwork shows through** each masked square, NOT the Portland sign.
  - The logo appears at the **top** of the grid (in the left two columns) and **repeats every 8 rows**, alternating between the left two columns and the right two columns each time.
  - **Each artwork appears 3 times**, in shuffled random order, regenerated on each visit.
  - Some cells are tall (2 rows); tall cells are throttled so two portrait images never stack adjacently.
- **Two modes:**
  - **Ambient (default):** grid auto-scrolls upward continuously, images NOT clickable. It is a motion graphic.
  - **Browse:** triggered by clicking "artwork", pressing Spacebar, or (on mobile) touching the grid. Scrolling stops, grid becomes manually scrollable, images become clickable → go to that artist's profile. On mobile first touch, a brief "tap to browse artwork" hint fades in/out.

---

## Portland Artists Page (`pages/artists.html`)
- **Background:** white. Standard light nav (dark logo + pancake + Portland link), white 56px bar.
- **Header:** "Portland Artists" (Nunito, ~2rem) + subtitle "A growing directory of working artists across the Portland metro."
- **Filter bar:** pill buttons — All (default active), Painter, Ceramicist, Illustrator. Filters the grid by medium.
- **Artist grid:** responsive grid of circular bio photos. Each card: circular photo, name (Nunito bold), then "Medium · Neighborhood". Links to the individual artist profile.
- Artists: Kurtis Piltz (Ceramicist · Multnomah Village), Beth Bundy (Illustrator & Paper Cut · Alberta Arts District), Yong Hong Zhong (Watercolor Painter · Portland), Lindsey Fox (Watercolor Painter · Portland), Jennifer Eaton White (Painter · Vancouver, WA).

---

## Portland Community Page (`pages/community.html`)
- **Background:** white. Standard light nav.
- **Header:** "Portland Community" (Nunito) + subtitle "Studios, galleries, and gathering places that support Portland's creative life."
- **Places grid:** cards with a 16:9 preview image, name (Nunito bold), and "Neighborhood · descriptor". Links to the individual place profile.
- Places: Multnomah Arts Center, ComeUnity PDX, NW Marine Art Works, Portland Art Studios.

---

## Individual Artist Profile (`artists/*.html`)
**SPEC (target design):**
- **Background:** white. Standard light nav (dark logo + pancake + Portland link).
- **Back link:** "← artists" → `artists.html`.
- **Hero:** a short horizontal banner image of the artist's work.
- **Identity block:** circular bio photo (overlapping the hero), then name (Nunito bold), then a single meta row: **"Medium · Neighborhood · City, ST"** — all on one aligned line.
- **Bio:** 1–2 short paragraphs.
- **Link line:** SIMPLE, not a sentence. Format like `lefoxstudio.com · @lefoxstudio` or just `@handle` in gray. (NOT "Contact X directly through Instagram…")
- **Community section:** labeled "Community", a list of affiliated orgs/places (links).
- **Artwork gallery:** **3 side-by-side squares** on web (equal size, single row). On mobile: full-width images stacked/scrolling (not tiny side-by-side).

**CURRENT STATE (needs fixing):**
- Link line on Kurtis still reads the full sentence "Contact Kurtis directly through Instagram for a viewing and to purchase work." — must become simple `@kurtispiltz`.
- Gallery is currently a 2-column grid with one TALL hero image + 3 squares (4 images, uneven) using `.artwork-gallery` / `.art-cell.tall` — must become 3 equal side-by-side squares on web.
- Nav uses class `nav-city-link` (older) — should be consistent with the `nav-city` pattern used on newer pages (cosmetic; both link to portland.html).
- Meta row uses `artist-bio-medium` + `artist-bio-location` — verify alignment is correct on web (currently reported misaligned).

The 5 artists: Kurtis Piltz, Beth Bundy, Yong Hong Zhong, Lindsey Fox, Jennifer Eaton White.

---

## Individual Place Profile (`places/*.html`)
- **Background:** white. Standard light nav.
- **Back link:** "← community" → `community.html`.
- Hero image, place name (Nunito), description, relevant links/details.
- Places: Multnomah Arts Center, ComeUnity PDX, NW Marine Art Works, Portland Art Studios.

---

## Network Page (`pages/network.html`)
- **Background:** dark. Solid dark 56px nav bar with WHITE logo + pancake + "Portland" link.
- **Content:** D3 force-directed graph of REAL nodes only: artists (5), places (MAC, ComeUnity, NW Marine, Alberta St Gallery, Portland Art Studios), events (NWMAW Open Studios, Multnomah Days 2026).
- **Opportunity nodes REMOVED** (no RACC, no Make|Learn|Build, no opportunity legend/color/size).
- Place→place edge: NW Marine ↔ Portland Art Studios.

---

## About Page (`pages/about.html`)
- **Background:** white. Solid white 56px top bar with dark logo + pancake + "Portland" link.
- **No "About Art Here" title.** Leads with tagline "Art Here puts local artists on the map." (Nunito).
- **Copy:**
  - Para 1: community initiative, makes local artists visible, connects to economic opportunity, partner with local orgs to host celebrations / capture stories / build a living online directory.
  - Para 2: piloting in Portland summer 2026, presence at Multnomah Days Festival in partnership with Multnomah Arts Center; next stops Biloxi, MS and San Jose, CA.
  - Para 3: "If you're interested in having your artwork or organization featured, share more here" (→ survey).
  - Para 4: "If you'd like to partner with us to bring Art Here to your neighborhood or city, reach out" (→ #contact).
- **Contact block:** Email only — hello@axlab.io. (No Instagram, no web.)

---

## Contact Page (`pages/contact.html`)
- Legacy page. The real contact info lives at `about.html#contact`. Pancake "Contact" link points to `about.html#contact`.

---

## Survey Page (`pages/survey.html`) — PENDING / NOT YET BUILT
- "Join Us" links across the site point here.
- Currently does not exist as a file. To be built (Google Forms / Typeform / Airtable decision pending).

---

## Known Pending Items
- [ ] Artist profile pages: fix link lines to simple format, fix gallery to 3 side-by-side squares, verify meta-row alignment.
- [ ] Build `pages/survey.html`.
- [ ] Each city to get a distinct visual identity from a local flyer design competition (future).
- [ ] Remove any leftover fake-artist files (Jamal/Maya/Rosa/Theo) from the GitHub repo if still present.
