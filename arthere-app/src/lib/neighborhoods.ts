// Shared neighborhood helpers — filters and dropdowns across artists,
// artwork, places, and the network graph all need the same "is this really
// a neighborhood, not just the city name" check and the same normalization,
// so it lives here once instead of four slightly-drifted copies.

// A neighborhood value that's really just the city (or "Portland, OR" etc.)
// rather than an actual neighborhood — filtered out of neighborhood lists.
export function isCityLevelNeighborhood(value: string): boolean {
  const v = value.trim();
  if (/^(Portland(,?\s*(OR|Oregon))?|Vancouver(,?\s*WA)?)$/i.test(v)) return true;
  // Splitting "Portland, OR" on the comma leaves a bare "OR" behind, which
  // is not a neighborhood. Same for the city's own nickname.
  return /^(OR|Oregon|WA|Washington|PDX)$/i.test(v);
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
  // Split on commas *and* on "and"/"&": people write "NW Portland and
  // Beaverton" as a single answer, and they mean both, so it should surface
  // under each rather than becoming its own one-off filter option.
  for (const part of (raw ?? '').split(/,|\s+(?:and|&)\s+/i)) {
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

// ─── Grouping ────────────────────────────────────────────────────────────────

export interface NeighborhoodGroup {
  /** Area name, e.g. "SW Portland". Null for values not yet filed. */
  area: string | null;
  neighborhoods: string[];
}

/**
 * Every neighborhood actually in use, grouped under its curated area and
 * ordered as arranged in /admin/neighborhoods.
 *
 * Only returns values that appear on a real profile — the curated tables can
 * hold names nobody uses any more, and showing those as filter options that
 * match nothing is worse than omitting them. Anything marked hidden (test
 * data, typos) is dropped, and anything not yet filed lands in a trailing
 * group with a null area.
 */
export async function getGroupedNeighborhoods(): Promise<NeighborhoodGroup[]> {
  const { prisma } = await import('@/lib/db');
  const [inUse, areas, curated] = await Promise.all([
    getKnownNeighborhoods(),
    prisma.neighborhoodArea.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.neighborhood.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  const inUseSet = new Set(inUse);
  const byName = new Map(curated.map((n) => [n.name, n]));

  const groups: NeighborhoodGroup[] = [];
  for (const area of areas) {
    const members = curated
      .filter((n) => n.areaId === area.id && !n.hidden && inUseSet.has(n.name))
      .map((n) => n.name);
    if (members.length > 0) groups.push({ area: area.name, neighborhoods: members });
  }

  const filed = new Set(groups.flatMap((g) => g.neighborhoods));
  const unfiled = inUse
    .filter((n) => !filed.has(n) && !byName.get(n)?.hidden)
    .sort();
  if (unfiled.length > 0) groups.push({ area: null, neighborhoods: unfiled });

  return groups;
}

/** Flat, group-ordered list — for callers that only need the option order. */
export async function getOrderedNeighborhoods(): Promise<string[]> {
  return (await getGroupedNeighborhoods()).flatMap((g) => g.neighborhoods);
}
