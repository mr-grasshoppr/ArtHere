# Art Here — Claude Code Handoff Brief
**Date:** May 24, 2026  
**Prepared by:** Claude (claude.ai conversation)  
**Continuing in:** Claude Code

---

## Project Overview
Art Here is a static HTML/CSS/JS website hosted on GitHub Pages at **artishere.org** (Namecheap DNS). It is a community initiative making local creative communities visible and economically connected. Portland, OR is the live pilot. Biloxi, MS and San Jose, CA are coming soon.

- **GitHub repo:** contains the full site at root level (index.html at root)
- **Contact:** hello@axlab.io  
- **Instagram:** @artishere.pdx  
- **No frameworks.** Pure HTML/CSS/JS. Google Fonts (Inter + Nunito). D3.js for network graph.
- **Backend (planned):** Airtable for artist directory

---

## File Structure
```
/
├── index.html                          # Home page
├── images/
│   ├── ArtHere_favicon.png             # Favicon (the A triangle shape)
│   ├── arthere-mask.png                # Full logo mask (white=opaque, black=transparent) for home page window
│   ├── arthere-logo-white.png          # White logo on transparent bg — used on DARK pages
│   ├── arthere-logo-dark.png           # Black logo on transparent bg — used on LIGHT pages
│   ├── arthere-mask-left.png           # LEFT half mask for Portland grid (A over HE)
│   ├── arthere-mask-right.png          # RIGHT half mask for Portland grid (RT over RE)
│   ├── bg-art1.png                     # Sliding artwork for home page logo window
│   ├── bg-art2.jpg                     # Sliding artwork for home page logo window
│   ├── portland-sign.jpg               # Portland Oregon neon sign (credit: Steve Morgan)
│   ├── artists/
│   │   ├── kurtis-piltz-bio.jpg
│   │   ├── beth-bundy-bio.jpg
│   │   ├── yong-hong-zhong-bio.jpg
│   │   ├── lindsey-fox-bio.jpg
│   │   └── jennifer-eaton-white-bio.jpg
│   ├── artwork/
│   │   ├── beth-bundy-hero.jpg / -1.jpg / -2.jpg / -3.jpg
│   │   ├── jennifer-eaton-white-hero.jpg / -1.jpg / -2.jpg / -3.jpg
│   │   ├── kurtis-piltz-hero.jpg / -1.jpg / -2.jpg / -3.jpg
│   │   ├── lindsey-fox-hero.jpg / -1.jpg / -2.jpg / -3.jpg
│   │   └── yong-hong-zhong-1.jpg / -2.jpg / -3.jpg / -4.jpg
│   └── places/
│       ├── multnomah.jpg
│       ├── communitypdx.jpg
│       ├── nwmarine-header.jpg
│       ├── nwmarine-mural1.jpg
│       ├── nwmarine-interior.jpg
│       ├── nwmarine.jpg
│       └── alberta.jpg
├── pages/
│   ├── portland.html                   # Portland city page (full-screen grid)
│   ├── artists.html                    # Portland artists listing
│   ├── community.html                  # Portland community/places listing
│   ├── network.html                    # D3 force-directed network graph
│   ├── about.html                      # About + contact
│   ├── contact.html                    # Legacy, links to about.html#contact
│   └── survey.html                     # *** DOES NOT EXIST YET — needs to be built ***
├── artists/
│   ├── kurtis-piltz.html
│   ├── beth-bundy.html
│   ├── yong-hong-zhong.html
│   ├── lindsey-fox.html
│   └── jennifer-eaton-white.html
├── places/
│   ├── multnomah-arts-center.html
│   ├── comeunity-pdx.html
│   ├── nw-marine-art-works.html
│   └── portland-art-studios.html
└── DESIGN_SOURCE_OF_TRUTH.md           # Full design spec — read this first
```

---

## Global Design Rules

### Fonts
- Body: **Inter** (300/400/500/600) via Google Fonts
- Display/headers/logos/city labels: **Nunito** (600/700), fallback `'Arial Rounded MT Bold', Arial, sans-serif`

### Nav (universal — applies to every page)
- NO full-width sticky nav bars with text links
- Every page: **Art Here logo** top-left (links to index.html) + **pancake menu** (dropdown, not side panel)
- Pancake menu order: **Join Us** → survey.html, **About** → about.html, **Contact** → about.html#contact
- Portland-scoped pages also show **"Portland"** in Nunito to the right of pancake → links to portland.html
- **Light pages** (white bg): dark logo (`arthere-logo-dark.png`), black pancake lines, white top bar
- **Dark pages** (black bg): white logo (`arthere-logo-white.png`), white pancake lines, black top bar
- Top bar is always **56px solid** so nav is never lost while scrolling

### Colors
- Background dark: `#0a0a0a` / `#000`
- Background light: `#fff`
- Text dark: `#1a1a1a`
- Text muted: `#888`, `#aaa`, `#ccc`
- Grid gap: `5px`
- Border radius on grid cells: `6px`

---

## Page-by-Page Spec

### index.html — Home Page
- White background
- Pancake menu top-left (dropdown: Join Us / About / Contact) — NO Art Here logo here
- Cities list fixed top-left under pancake, tightly stacked:
  - "Portland, OR" → pages/portland.html (live, with arrow)
  - "Biloxi, MS" + "coming soon" tag (grayed, not clickable)
  - "San Jose, CA" + "coming soon" tag (grayed, not clickable)
- Center: large Art Here logo as **CSS mask window** (`min(60vw, 520px)`, aspect ratio 1668/1457)
  - Artwork images slide horizontally behind the logo cutouts (CSS animation)
  - Uses `arthere-mask.png` as mask-image
- Footer: "© 2026 Art Here · A project of Art Experience Lab"

### pages/portland.html — Portland City Page
**CURRENT ISSUE TO FIX:**
The two logo half-panels (left = A/HE, right = RT/RE) are not aligning correctly.
They appear at different heights and with a gap between them.

**INTENDED DESIGN:**
- Full black page, `overflow: hidden`
- 56px black top bar: white Art Here logo → home, pancake menu, "Portland" text → portland.html
- 56px black bottom bar: `artwork · artists · community · network`
- Grid fills between the bars: 4 cols desktop / 3 cols mobile, 5px gaps, 6px rounded corners
- **Logo treatment at top of grid:**
  - A single wrapper div spanning 2 columns, containing left and right panels with ZERO gap between them
  - Left panel: masked with `arthere-mask-left.png` (A over HE)
  - Right panel: masked with `arthere-mask-right.png` (RT over RE)  
  - Both panels same height (one grid row = COL px square)
  - Artwork image shows through the logo cutouts
  - Logo appears ONCE only at the top
  - **PENDING:** Maryanna is preparing new left/right mask files with corner anchor dots to fix alignment. When received, replace `arthere-mask-left.png` and `arthere-mask-right.png` and convert: white pixels → alpha=255, black → alpha=0
- Grid: each artwork appears 3×, shuffled randomly on each visit
- Tall cells (2 rows) mixed in, throttled so no two consecutive tall cells
- **Two modes:**
  - **Ambient (default):** auto-scrolls upward continuously, not clickable
  - **Browse:** triggered by clicking "artwork" nav, spacebar, clicking grid, or touching screen
    - Should FREEZE at current scroll position (capture translateY from CSS animation, lock it)
    - Grid becomes manually scrollable, images become clickable → artist profile
    - Clicking "artwork" again returns to ambient

### pages/artists.html — Portland Artists Listing
- White bg, standard light nav
- "Portland Artists" header (Nunito), subtitle
- Filter pills: All / Painter / Ceramicist / Illustrator
- Responsive grid of circular bio photos
- Each card: photo, name (Nunito bold), "Medium · Neighborhood"
- 5 artists: Kurtis Piltz, Beth Bundy, Yong Hong Zhong, Lindsey Fox, Jennifer Eaton White

### pages/community.html — Portland Community Listing
- White bg, standard light nav
- "Portland Community" header (Nunito)
- Card grid with 16:9 images: Multnomah Arts Center, ComeUnity PDX, NW Marine Art Works, Portland Art Studios

### artists/*.html — Individual Artist Profiles
**CURRENT ISSUES (need fixing):**
1. Gallery should be **3 equal-width squares side by side** on desktop (not a 2-col grid with tall hero)
2. On mobile: single column, full-width, scrollable
3. Kurtis Piltz link line still reads a full sentence — should be just `@kurtispiltz`
4. Meta row (medium · neighborhood · city) alignment is off on web

**INTENDED DESIGN:**
- White bg, standard light nav with Portland link
- Back link: "← artists" → pages/artists.html
- Short hero banner image
- Circular bio photo overlapping hero bottom
- Name (Nunito bold ~1.6rem), then single meta line: "Medium · Neighborhood · City, ST"
- Bio paragraph(s)
- Link line: SIMPLE format only — `website.com · @handle` or just `@handle` — NOT sentences
- "Community" section: list of affiliated orgs
- Artwork gallery: **3 equal squares** on desktop, single column on mobile

### places/*.html — Individual Place Profiles
- White bg, standard light nav with Portland link
- Back link: "← community" → pages/community.html

### pages/network.html — Network Graph
- Dark bg, dark nav with white logo + Portland link
- D3 force-directed graph
- Nodes: 5 artists + places (MAC, ComeUnity, NW Marine, Alberta St Gallery, Portland Art Studios) + events (NWMAW Open Studios, Multnomah Days 2026)
- NO opportunity nodes (RACC, Make|Learn|Build removed)
- Place↔place edge: NW Marine ↔ Portland Art Studios

### pages/about.html
- White bg, standard light nav with Portland link
- Leads with tagline "Art Here puts local artists on the map." (Nunito, no "About" title)
- 4 paragraphs (see DESIGN_SOURCE_OF_TRUTH.md for exact copy)
- Contact section: email only — hello@axlab.io

### pages/survey.html — NOT YET BUILT
- All "Join Us" links across the site point here
- Needs to be built (platform TBD: Airtable Forms / Typeform / Google Forms)
- Maryanna's preference was leaning toward Airtable (feeds directory) or Typeform (best mobile UX)

---

## The 5 Portland Artists

| Artist | Medium | Neighborhood | Links | Community affiliations |
|---|---|---|---|---|
| Kurtis Piltz | Ceramicist | Multnomah Village (97219) | @kurtispiltz | MAC, Catlin Gabel, PSU, PCC |
| Beth Bundy | Illustrator & Paper Cut | Alberta Arts District (97211) | @layersandsquares | Lincoln HS, Clinton St Coffeehouse, Rudy's Barbershop |
| Yong Hong Zhong | Watercolor Painter | Portland | yonghongzhong.com | Grey Raven Gallery, Art on the Boulevard, PAM Rental Sales |
| Lindsey Fox | Watercolor Painter | Portland | lefoxstudio.com · @lefoxstudio | NW Marine Art Works, ComeUnity PDX, Portland Art Studios |
| Jennifer Eaton White | Painter (watercolor/ink/oil/encaustics) | Vancouver, WA | @jennymay · @flyspeckpress | Smith & Vallee (closed Dec 2025), Alberta St Gallery, Casa Luna |

## The 4 Portland Places
- **Multnomah Arts Center** — Multnomah Village; multnomahartscenter.org · @macapdx
- **ComeUnity PDX** — NE Portland; founder Nell Bostwick; comeunitypdx.com · @comeunitypdx
- **NW Marine Art Works** — NW Industrial, 75+ studios; nwmarineartworks.com · @nwmarineartworks
- **Portland Art Studios** — 4-building collective (NW Marine, Carton Service, North Coast Seed, River Street); portlandartstudios.com

---

## Immediate Priorities (in order)

1. **Fix Portland logo panels** — waiting on new mask files from Maryanna (files with corner anchor dots to fix bounding box). When received: convert white→opaque, black→transparent, save as `arthere-mask-left.png` and `arthere-mask-right.png`. The wrapper spans 2 grid columns with `gap: 0` between panels.

2. **Fix artist profile galleries** — change from 2-col grid with tall hero to 3 equal squares on desktop, single column on mobile. Fix Kurtis link line to `@kurtispiltz`.

3. **Build survey.html** — "Join Us" links point here from every page. Decide on platform with Maryanna first.

4. **Fix artist meta row alignment** — "Medium · Neighborhood · City, ST" should be on one clean line.

---

## Logo Mask Processing (Python)
When Maryanna sends new PNG files (white letterforms on black/transparent background):
```python
from PIL import Image
import numpy as np

def to_mask(src_path, out_path):
    img = Image.open(src_path).convert('RGBA')
    arr = np.array(img)
    lum = arr[:,:,:3].mean(axis=2)
    mask = np.zeros_like(arr)
    mask[:,:,0] = 255; mask[:,:,1] = 255; mask[:,:,2] = 255
    mask[:,:,3] = np.where(lum > 128, 255, 0).astype(np.uint8)
    Image.fromarray(mask, 'RGBA').save(out_path)

# Full logo
to_mask('new_logo.png', 'images/arthere-mask.png')
# Also copy to arthere-logo-white.png (same file, different use)

# For dark version (black letters on transparent)
def to_dark(src_path, out_path):
    img = Image.open(src_path).convert('RGBA')
    arr = np.array(img)
    lum = arr[:,:,:3].mean(axis=2)
    dark = np.zeros_like(arr)
    dark[:,:,3] = np.where(lum > 128, 255, 0).astype(np.uint8)
    Image.fromarray(dark, 'RGBA').save(out_path)

to_dark('new_logo.png', 'images/arthere-logo-dark.png')

# Split halves
to_mask('new_logo_left.png', 'images/arthere-mask-left.png')
to_mask('new_logo_right.png', 'images/arthere-mask-right.png')
```

---

## Key Decisions Already Made
- No em-dashes in any copy (Maryanna's strong preference)
- "Community" not "Places" throughout
- Each city will eventually have its own visual identity from a local flyer competition
- Portland pilot is self-funded, launching at Multnomah Days Festival Aug 15 2026 with Multnomah Arts Center
- Airtable is the planned backend for the artist directory
- The network graph uses only real, confirmed data — no placeholder nodes
- NW Marine Open Studios: May 29 preview 5–8pm + May 30–31

---

## Maryanna's Writing Style
- Warm, direct, personal voice
- No em-dashes
- Sensitive to repeated words in close proximity
- Prefers short, simple link lines (not sentences)
- Centers community and human artists — avoid AI/tech framing
