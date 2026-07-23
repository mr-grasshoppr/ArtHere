// ─────────────────────────────────────────────────────────────────────────────
// PLACES — single source of truth for all community places on Art Here Portland
//
// Adding a new place here automatically updates:
//   • The "Place" filter dropdown on the Artists page
//   • The "Place" filter dropdown on the Artwork page
//   • The place cards and filter dropdown on the Community page
//
// Fields:
//   id          — unique slug, matches the filename in /places/
//   name        — display name
//   url         — path to the place page (relative to /pages/)
//   neighborhood — matches data-neighborhood on artist cards (used for filtering)
//   image       — hero image path (null = show name as fallback)
//   meta        — short descriptor shown under the place name
// ─────────────────────────────────────────────────────────────────────────────
var PLACES = [
  {
    id:           'nw-marine-art-works',
    name:         'NW Marine Art Works',
    url:          '../places/nw-marine-art-works.html',
    neighborhood: 'Slabtown',
    image:        '../images/places/nwmarine-header.jpg',
    meta:         'NW Industrial · 75+ Artist Studios'
  },
  {
    id:           'multnomah-arts-center',
    name:         'Multnomah Arts Center',
    url:          '../places/multnomah-arts-center.html',
    neighborhood: 'Multnomah Village',
    image:        '../images/places/multnomah.jpg',
    meta:         'Multnomah Village · Classes, Studios, Gallery'
  },
  {
    id:           'comeunity-pdx',
    name:         'ComeUnity PDX',
    url:          '../places/comeunity-pdx.html',
    neighborhood: 'NE Portland',
    image:        '../images/places/communitypdx.jpg',
    meta:         'NE Portland · Retail, Gallery &amp; Events'
  },
  {
    id:           'portland-art-studios',
    name:         'Portland Art Studios',
    url:          '../places/portland-art-studios.html',
    neighborhood: 'NW Industrial',
    image:        null,
    meta:         'NW Industrial · 4-building artist collective'
  },
  {
    id:           'alberta-street-gallery',
    name:         'Alberta Street Gallery',
    url:          '../places/alberta-street-gallery.html',
    neighborhood: 'Alberta Arts District',
    image:        '../images/places/alberta-street-gallery-hero.jpg',
    meta:         'Alberta Arts District · Member-run gallery'
  },
];
