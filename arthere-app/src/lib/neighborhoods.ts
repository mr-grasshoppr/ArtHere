// Shared neighborhood helpers — filters and dropdowns across artists,
// artwork, places, and the network graph all need the same "is this really
// a neighborhood, not just the city name" check and the same normalization,
// so it lives here once instead of four slightly-drifted copies.

// A neighborhood value that's really just the city (or "Portland, OR" etc.)
// rather than an actual neighborhood — filtered out of neighborhood lists.
export function isCityLevelNeighborhood(value: string): boolean {
  return /^(Portland(,?\s*(OR|Oregon))?|Vancouver(,?\s*WA)?)$/i.test(value.trim());
}

// Any "Multnomah..." variant (Multnomah, Multnomah Village, Multnomah
// County, etc.) refers to the same neighborhood — collapse them all to one
// canonical name so they don't fragment into separate filter options.
export function normalizeNeighborhood(raw: string): string {
  const trimmed = raw.trim();
  if (/^multnomah\b/i.test(trimmed)) return 'Multnomah Village';
  return trimmed;
}
