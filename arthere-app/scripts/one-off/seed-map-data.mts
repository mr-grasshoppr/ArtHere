// SAFETY GUARD — one-off scripts here mutate production data. They will NOT
// run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== '1') {
  console.error('Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally.');
  process.exit(1);
}

// First data for the map tab's Geographic view (2026-10-01), after the
// 20260929120000_add_map_fields migration:
//
//   - Places: street addresses (looked up from each place's own site / Yelp /
//     EverOut and reviewed by Maryanna), geocoded once, and showOnMap on.
//     Tender Loving Empire gets its three stores its profile lists; the
//     airport store is left off.
//   - Artists: showOnMap on for every live, non-archived artist with a
//     neighborhood on their public profile — Maryanna's call: a neighborhood
//     an artist already shows publicly counts as consent to be counted there.
//
// Usage (from arthere-app/):
//   RUN_ONE_OFF=1 npx tsx scripts/one-off/seed-map-data.mts           # dry run: prints only
//   RUN_ONE_OFF=1 npx tsx scripts/one-off/seed-map-data.mts --apply   # writes
//
// Safe to re-run: addresses are replaced with the same list (unchanged ones
// keep their coordinates, so nothing is re-geocoded), and showOnMap only ever
// goes from off to on here.

import { prisma } from '@/lib/db';
import { syncPlaceLocations, type PlaceLocationInput } from '@/lib/geocode';
import { parseNeighborhoodList, isCityLevelNeighborhood } from '@/lib/neighborhoods';

const APPLY = process.argv.includes('--apply');

const PLACES: Record<string, PlaceLocationInput[]> = {
  'Multnomah Arts Center': [{ streetAddress: '7688 SW Capitol Hwy, Portland, OR 97219' }],
  'Village Frame & Gallery': [{ streetAddress: '7808 SW Capitol Hwy, Portland, OR 97219' }],
  'Alberta Street Gallery': [{ streetAddress: '1829 NE Alberta St, Portland, OR 97211' }],
  'ComeUnity PDX': [{ streetAddress: '3536 SW Troy St, Portland, OR 97219' }],
  'Maplewood Coffee and Tea': [{ streetAddress: '5206 SW Custer St, Portland, OR 97219' }],
  'Tender Loving Empire': [
    { label: 'West End', streetAddress: '412 SW 10th Ave, Portland, OR 97205' },
    { label: 'NW 23rd', streetAddress: '525 NW 23rd Ave, Portland, OR 97210' },
    { label: 'Hawthorne', streetAddress: '3541 SE Hawthorne Blvd, Portland, OR 97214' },
  ],
};

console.log(APPLY ? '— APPLYING —' : '— DRY RUN (pass --apply to write) —');

console.log('\nPlaces:');
for (const [name, locations] of Object.entries(PLACES)) {
  const matches = await prisma.place.findMany({ where: { name }, select: { id: true, slug: true, showOnMap: true } });
  if (matches.length !== 1) {
    console.log(`  ✗ ${name}: expected exactly one place with this name, found ${matches.length} — skipped`);
    continue;
  }
  const [place] = matches;
  console.log(`  ${name} (${place.slug}): ${locations.map((l) => (l.label ? `${l.label}: ` : '') + l.streetAddress).join(' | ')}`);
  if (!APPLY) continue;
  await syncPlaceLocations(place.id, locations);
  if (!place.showOnMap) await prisma.place.update({ where: { id: place.id }, data: { showOnMap: true } });
  const saved = await prisma.placeLocation.findMany({ where: { placeId: place.id }, orderBy: { sortOrder: 'asc' } });
  for (const loc of saved) {
    console.log(`      ${loc.lat != null ? '✓' : '✗ NOT FOUND —'} ${loc.streetAddress}${loc.lat != null ? ` → ${loc.lat.toFixed(5)}, ${loc.lng!.toFixed(5)}` : ''}`);
  }
  // Nominatim asks for at most one request a second; syncPlaceLocations
  // spaces its own lookups, and this spaces one place from the next.
  await new Promise((r) => setTimeout(r, 1100));
}

console.log('\nArtists (live, not archived, with a neighborhood on their profile):');
const artists = await prisma.artist.findMany({
  where: { isPlaceholder: false, isArchived: false, showOnMap: false },
  select: { id: true, name: true, neighborhood: true },
  orderBy: { name: 'asc' },
});
const opting = artists.filter((a) => parseNeighborhoodList(a.neighborhood).some((n) => !isCityLevelNeighborhood(n)));
for (const a of opting) console.log(`  ${a.name} — ${a.neighborhood}`);
console.log(`  ${opting.length} to turn on (${artists.length - opting.length} live artists left off: no neighborhood beyond the city)`);
if (APPLY && opting.length > 0) {
  const { count } = await prisma.artist.updateMany({ where: { id: { in: opting.map((a) => a.id) } }, data: { showOnMap: true } });
  console.log(`  ✓ turned on for ${count}`);
}

await prisma.$disconnect();
