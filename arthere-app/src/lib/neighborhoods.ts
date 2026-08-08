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

// Artist/Place `neighborhood` columns store multiple values as a
// comma-joined string (same convention as Artist.medium — see
// parseMediumList in artist-options.ts) rather than a Postgres array, so no
// migration was needed to support more than one neighborhood per profile.
// Anywhere that reads or writes the field should go through these two
// helpers rather than touching the raw string directly.
export function parseNeighborhoodList(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  for (const part of (raw ?? '').split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    seen.add(normalizeNeighborhood(trimmed));
  }
  return [...seen];
}

export function joinNeighborhoodList(list: string[]): string | null {
  const parsed = parseNeighborhoodList(list.join(','));
  return parsed.length > 0 ? parsed.join(', ') : null;
}

// Every neighborhood value currently in use across both Place and Artist
// profiles, for populating the neighborhood picker's option list. Server-only
// (imports prisma) — safe to add here since every current importer of this
// file is a server component/action/route.
export async function getKnownNeighborhoods(): Promise<string[]> {
  const { prisma } = await import('@/lib/db');
  const [places, artists] = await Promise.all([
    prisma.place.findMany({ select: { neighborhood: true } }),
    prisma.artist.findMany({ select: { neighborhood: true } }),
  ]);
  const all = new Set<string>();
  for (const { neighborhood } of [...places, ...artists]) {
    for (const n of parseNeighborhoodList(neighborhood)) {
      if (!isCityLevelNeighborhood(n)) all.add(n);
    }
  }
  return [...all].sort();
}
