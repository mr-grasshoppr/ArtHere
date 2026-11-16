// Maps a US zip code to the hub city whose map it belongs on. Used when a
// survey respondent asks to be featured: someone in Beaverton or Oregon City
// still belongs on the Portland map. Unlisted zips return null and are left
// for an admin to place.

const PORTLAND_METRO_ZIPS = new Set([
  // Portland proper: 972xx is added by prefix below.
  // Beaverton / Aloha / Cedar Mill
  '97003', '97005', '97006', '97007', '97008', '97075', '97076', '97077', '97078',
  // Hillsboro, Cornelius, Forest Grove, Sherwood
  '97123', '97124', '97113', '97116', '97140',
  // Tigard, Tualatin, Lake Oswego, West Linn, Wilsonville
  '97223', '97224', '97062', '97034', '97035', '97068', '97070',
  // Milwaukie, Oak Grove, Happy Valley, Clackamas, Gladstone, Oregon City, Canby, Sandy
  '97222', '97267', '97268', '97015', '97086', '97027', '97045', '97013', '97055',
  // Gresham, Troutdale, Fairview, Wood Village
  '97030', '97080', '97060', '97024',
]);

/** Slug of the hub city for this zip, or null if it isn't in a known metro. */
export function metroHubSlug(zip: string | null | undefined): string | null {
  const z = (zip ?? '').trim().slice(0, 5);
  if (!/^\d{5}$/.test(z)) return null;
  if (z.startsWith('972')) return 'portland';
  if (PORTLAND_METRO_ZIPS.has(z)) return 'portland';
  // Vancouver, Camas, Washougal, Battle Ground, Ridgefield (WA side of the metro)
  if (z >= '98660' && z <= '98687') return 'portland';
  return null;
}
