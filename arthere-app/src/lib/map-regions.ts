// Pure helpers for the map tab's Geographic view — matching the free-text
// neighborhood on a profile to a polygon in src/data/map-regions.json, and
// turning an artist count into a fill colour. No React, no Prisma, so it's
// shared by the client map and the unit tests.

import { normalizeNeighborhood } from '@/lib/neighborhoods';

export interface MapRegionProperties {
  /** Stable id, e.g. "portland--multnomah" or "beaverton". */
  id: string;
  /** Official name, as shown on the map. */
  name: string;
  /** The city it belongs to. */
  region: string;
  /**
   * 'area' for a Portland quadrant (drawn zoomed out), 'neighborhood' for a
   * neighborhood inside one (drawn zoomed in), 'city' for a labeled
   * whole-city shape and 'community' for an unlabeled fill-in place between
   * them (both drawn at every zoom).
   */
  level: 'area' | 'neighborhood' | 'city' | 'community';
  /** Other names people use for the same polygon ("Multnomah Village", "SW Portland"). */
  aliases: string[];
  /** A neighborhood's quadrant id — its artists count there too. */
  parent?: string;
  /** Map label for an area or city ("SW", "Beaverton"). */
  shortName?: string;
  /** [lng, lat] inside the shape, where its map label goes. */
  labelPoint?: [number, number];
}

export type MapRegionFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, MapRegionProperties>;

const key = (s: string) => normalizeNeighborhood(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * name/alias -> region id. Official names win over aliases if the two ever
 * collide, so a typo'd alias can't steal a real neighborhood.
 */
export function buildRegionIndex(regions: MapRegionProperties[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const r of regions) for (const a of r.aliases) index.set(key(a), r.id);
  for (const r of regions) index.set(key(r.name), r.id);
  return index;
}

export function regionIdFor(neighborhood: string, index: Map<string, string>): string | null {
  return index.get(key(neighborhood)) ?? null;
}

export interface RegionStat {
  count: number;
  /**
   * The neighborhood values, as artists actually typed them, that landed in
   * this region — what the artists page's neighborhood filter matches on, so
   * drilling through shows the same people the map counted.
   */
  names: string[];
}

/**
 * Every region one artist belongs to, keyed by region id, with the names they
 * typed that put them there. A neighborhood's artists also belong to its
 * quadrant, alongside anyone who only gave the quadrant ("SW Portland").
 */
export function regionHitsFor(neighborhoods: string[], index: Map<string, string>, parentOf: Map<string, string>) {
  const hits = new Map<string, string[]>();
  for (const n of neighborhoods) {
    const id = regionIdFor(n, index);
    if (!id) continue;
    for (const hit of [id, parentOf.get(id)]) {
      if (!hit) continue;
      const names = hits.get(hit) ?? [];
      if (!names.includes(n)) names.push(n);
      hits.set(hit, names);
    }
  }
  return hits;
}

export const buildParentIndex = (regions: MapRegionProperties[]) =>
  new Map(regions.filter((r) => r.parent).map((r) => [r.id, r.parent!]));

/**
 * Artists per region. `artists` is each artist's parsed neighborhood list; an
 * artist who lists two neighborhoods counts once in each, but never twice in
 * the same one (e.g. "Multnomah, Multnomah Village"), and counts toward the
 * quadrant those neighborhoods are in. Artists whose answer doesn't resolve
 * to any polygon — "Portland", or a city we don't draw — come back as
 * `unplaced` so the legend can say so instead of silently dropping them.
 */
export function countArtistsByRegion(
  regions: MapRegionProperties[],
  artists: string[][]
): { stats: Record<string, RegionStat>; unplaced: number } {
  const index = buildRegionIndex(regions);
  const parentOf = buildParentIndex(regions);
  const stats: Record<string, RegionStat> = {};
  let unplaced = 0;
  for (const list of artists) {
    const hits = regionHitsFor(list, index, parentOf);
    if (hits.size === 0) unplaced++;
    for (const [id, names] of hits) {
      const stat = (stats[id] ??= { count: 0, names: [] });
      stat.count++;
      for (const name of names) if (!stat.names.includes(name)) stat.names.push(name);
    }
  }
  return { stats, unplaced };
}

// ─── Colours ─────────────────────────────────────────────────────────────────
// Every region is the same neutral; the one under the pointer lights up in a
// pale brand chartreuse, and the one whose panel is open in the full brand
// chartreuse (#bdd349).

export const REGION_COLOR = '#262626';
export const REGION_HOVER_COLOR = '#dce79c';
export const REGION_SELECTED_COLOR = '#bdd349';
export const PLACE_PIN_COLOR = '#f96a9b';
