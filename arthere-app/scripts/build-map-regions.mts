/**
 * Builds src/data/map-regions.json — the polygons the map tab's Geographic
 * view shades by artist count.
 *
 *   npx tsx scripts/build-map-regions.mts
 *
 * Everything comes from the City of Portland's open-data boundary service
 * (portlandmaps.com, COP_OpenData_Boundary). Three levels of feature:
 *
 *   - 'area'         Portland's quadrants — what the zoomed-out map shows.
 *   - 'neighborhood' Portland's official neighborhoods, each tagged with the
 *                    quadrant it's in (`parent`) — what the zoomed-in map shows.
 *   - 'city'         Whole-city outlines for the satellite cities we don't yet
 *                    have neighborhood-level artist counts for; shown at every
 *                    zoom.
 *   - 'community'    Unlabeled fill-in between those — small cities, named
 *                    unincorporated communities (U.S. Census Bureau), and any
 *                    leftover enclosed pocket — so the map has no blank gaps.
 *
 * Quadrants are the city's official sextants, except that the small "South"
 * sextant (a strip along the river) is folded into SW, where most people
 * would place it.
 *
 * The map component knows nothing about which cities exist or how finely
 * they're divided — it draws whatever features this file writes. To break a
 * satellite city into neighborhoods once it has active artists, change its
 * REGIONS entry, re-run, and commit the regenerated JSON. No component change.
 *
 * ALIASES maps the names people actually type into a profile's neighborhood
 * field ("Multnomah Village", "SW Portland") onto the polygon they mean. It
 * lives in the data, not the component, for the same reason.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import polygonClipping, { type MultiPolygon as PCMultiPolygon } from 'polygon-clipping';
import simplify from 'simplify-js';
import polylabel from 'polylabel';

const SERVICE = 'https://www.portlandmaps.com/od/rest/services/COP_OpenData_Boundary/MapServer';
const NEIGHBORHOOD_LAYER = 3;
const CITY_LAYER = 10;
const SEXTANT_LAYER = 233;
const COUNTY_LAYER = 9;
// U.S. Census Bureau "Census Designated Places" — named unincorporated
// communities like Raleigh Hills and Cedar Mill.
const CENSUS_PLACES = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/5';

type Region = { name: string; detail: 'neighborhoods' | 'city' };

const REGIONS: Region[] = [
  { name: 'Portland', detail: 'neighborhoods' },
  { name: 'Beaverton', detail: 'city' },
  { name: 'Tigard', detail: 'city' },
  { name: 'Lake Oswego', detail: 'city' },
  { name: 'Milwaukie', detail: 'city' },
  { name: 'Vancouver', detail: 'city' },
  { name: 'West Linn', detail: 'city' },
  { name: 'Gresham', detail: 'city' },
  { name: 'Tualatin', detail: 'city' },
  { name: 'Oregon City', detail: 'city' },
  { name: 'Hillsboro', detail: 'city' },
];

// Fill-in: the places between the labeled ones, so the map has no blank
// gaps (Raleigh Hills between SW Portland and Beaverton, say). Drawn and
// clickable like any city — and an artist who lists one is counted there —
// but unlabeled, to keep the overview to the names people navigate by.
const FILL_CITIES = [
  'Gladstone', 'Happy Valley', 'Maywood Park', 'Fairview', 'Wood Village',
  'King City', 'Durham', 'Johnson City', 'Rivergrove',
];
const FILL_COMMUNITIES = [
  'Raleigh Hills', 'West Slope', 'Cedar Hills', 'Cedar Mill', 'Bethany', 'Garden Home-Whitford',
  'Metzger', 'West Haven-Sylvan', 'Dunthorpe', 'Stafford', 'Oak Grove', 'Jennings Lodge', 'Oatfield',
];
// Holes smaller than this (in square degrees, ~1,000 m²) are hairline slivers
// left by simplifying neighbors' shared edges — invisible, so left alone.
// Anything bigger, down to a pocket of a few houses, gets filled.
const MIN_HOLE_AREA = 0.0000001;

// Portland quadrants: short label (drawn on the map) -> full name + aliases.
const QUADRANTS: Record<string, { name: string; aliases: string[] }> = {
  N: { name: 'North Portland', aliases: ['N Portland', 'North', 'NoPo'] },
  NE: { name: 'Northeast Portland', aliases: ['NE Portland', 'Northeast', 'NE'] },
  NW: { name: 'Northwest Portland', aliases: ['NW Portland', 'Northwest', 'NW'] },
  SW: { name: 'Southwest Portland', aliases: ['SW Portland', 'Southwest', 'SW', 'South Portland', 'S Portland'] },
  SE: { name: 'Southeast Portland', aliases: ['SE Portland', 'Southeast', 'SE'] },
};
// Where a quadrant's label goes when the automatic spot (the point deepest
// inside the shape) isn't where people picture it — NE's is out by I-205,
// because the quadrant runs all the way to Gresham.
const LABEL_OVERRIDES: Record<string, [number, number]> = {
  NE: [-122.625, 45.548],
};
const SEXTANT_TO_QUADRANT: Record<string, string> = { N: 'N', NE: 'NE', NW: 'NW', SW: 'SW', S: 'SW', SE: 'SE' };

// Official polygon name -> other names that mean it.
const ALIASES: Record<string, string[]> = {
  Multnomah: ['Multnomah Village'],
  'Sylvan-Highlands': ['Sylvan Heights', 'Sylvan'],
  'Portland Downtown': ['West End', 'Downtown', 'Downtown Portland'],
  Concordia: ['Alberta Arts District', 'Alberta'],
  Sunnyside: ['Hawthorne'],
  'Old Town': ['Old Town Chinatown', 'Chinatown'],
  'Pearl District': ['Pearl', 'The Pearl'],
  Vancouver: ['Vancouver, WA'],
};

// Neighborhoods: ~10 m, plenty for a choropleth. Quadrants are only drawn
// zoomed out, so they can be coarser.
const NEIGHBORHOOD_SIMPLIFY = 0.0001;
const QUADRANT_SIMPLIFY = 0.0003;

type Ring = [number, number][];
type Poly = Ring[];

async function query(layer: number, where: string, fields: string, simplifyDeg?: number) {
  const params = new URLSearchParams({ where, outFields: fields, outSR: '4326', f: 'geojson', geometryPrecision: '6' });
  if (simplifyDeg) params.set('maxAllowableOffset', String(simplifyDeg));
  const res = await fetch(`${SERVICE}/${layer}/query?${params}`);
  if (!res.ok) throw new Error(`Layer ${layer}: HTTP ${res.status}`);
  return ((await res.json()) as { features: GeoJSON.Feature[] }).features;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const round = (n: number) => Math.round(n * 1e5) / 1e5;

function polys(f: GeoJSON.Feature): Poly[] {
  const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
  return (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as Poly[];
}

function roundPolys(ps: Poly[]): GeoJSON.MultiPolygon {
  return { type: 'MultiPolygon', coordinates: ps.map((p) => p.map((r) => r.map(([x, y]) => [round(x), round(y)]))) };
}

function simplifyPolys(ps: Poly[], tolerance: number): Poly[] {
  return ps
    .map((p) =>
      p
        .map((ring) => simplify(ring.map(([x, y]) => ({ x, y })), tolerance, true).map((pt) => [pt.x, pt.y] as [number, number]))
        .filter((ring) => ring.length >= 4)
    )
    .filter((p) => p.length > 0);
}

function ringArea(ring: Ring): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(a / 2);
}

/** A point well inside the largest part — where the shape's label goes. */
function labelPoint(ps: Poly[]): [number, number] {
  const biggest = ps.reduce((a, b) => (ringArea(b[0]) > ringArea(a[0]) ? b : a));
  const [x, y] = polylabel(biggest, 0.0005);
  return [round(x), round(y)];
}

function inRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inPolys = (pt: [number, number], ps: Poly[]) => ps.some((p) => inRing(pt, p[0]) && !p.slice(1).some((h) => inRing(pt, h)));

/** A city's outline — several parts kept as one shape that shades and counts as one. */
async function cityParts(name: string): Promise<Poly[]> {
  const raw = await query(CITY_LAYER, `CITYNAME='${name.replace(/'/g, "''")}'`, 'CITYNAME', NEIGHBORHOOD_SIMPLIFY);
  if (raw.length === 0) throw new Error(`No city boundary found for ${name}`);
  return raw.flatMap(polys);
}

async function censusPlaceParts(name: string): Promise<Poly[]> {
  const params = new URLSearchParams({
    where: `STATE='41' AND BASENAME='${name.replace(/'/g, "''")}'`,
    outFields: 'BASENAME',
    outSR: '4326',
    f: 'geojson',
    geometryPrecision: '6',
    maxAllowableOffset: String(NEIGHBORHOOD_SIMPLIFY),
  });
  const res = await fetch(`${CENSUS_PLACES}/query?${params}`);
  if (!res.ok) throw new Error(`Census place ${name}: HTTP ${res.status}`);
  const raw = ((await res.json()) as { features: GeoJSON.Feature[] }).features;
  if (raw.length === 0) throw new Error(`No census place found for ${name}`);
  return raw.flatMap(polys);
}

const community = (id: string, name: string, parts: Poly[]): GeoJSON.Feature => ({
  type: 'Feature',
  geometry: roundPolys(parts),
  properties: { id, name, region: name, level: 'community', aliases: [] },
});

/** Union of a list of shapes (polygon-clipping takes its first argument separately). */
function unionAll(shapes: PCMultiPolygon[]): Poly[] {
  const [first, ...rest] = shapes;
  return polygonClipping.union(first, ...rest) as Poly[];
}

const features: GeoJSON.Feature[] = [];

for (const region of REGIONS) {
  if (region.detail === 'neighborhoods') {
    // Full precision for the merge (independently simplified neighbors leave
    // slivers between them when unioned), simplified afterwards.
    const [raw, sextants] = await Promise.all([
      query(NEIGHBORHOOD_LAYER, '1=1', 'MAPLABEL'),
      query(SEXTANT_LAYER, '1=1', 'PREFIX'),
    ]);

    const byName = new Map<string, Poly[]>();
    for (const f of raw) {
      const name = String(f.properties?.MAPLABEL ?? '').trim();
      // Unincorporated pockets aren't places anyone would say they live.
      if (!name || /unclaimed/i.test(name)) continue;
      byName.set(name, [...(byName.get(name) ?? []), ...polys(f)]);
    }

    const quadrantParts = new Map<string, Poly[]>();
    for (const [name, parts] of byName) {
      const inside = labelPoint(parts);
      const sextant = sextants.find((s) => inPolys(inside, polys(s)));
      const quadrant = SEXTANT_TO_QUADRANT[String(sextant?.properties?.PREFIX ?? '')];
      if (!quadrant) throw new Error(`No quadrant for ${name}`);
      quadrantParts.set(quadrant, [...(quadrantParts.get(quadrant) ?? []), ...parts]);

      const simplified = simplifyPolys(parts, NEIGHBORHOOD_SIMPLIFY);
      features.push({
        type: 'Feature',
        geometry: roundPolys(simplified),
        properties: {
          id: `portland--${slugify(name)}`,
          name,
          region: region.name,
          level: 'neighborhood',
          parent: `portland--${slugify(quadrant)}`,
          aliases: ALIASES[name] ?? [],
        },
      });
    }

    for (const [short, { name, aliases }] of Object.entries(QUADRANTS)) {
      const parts = quadrantParts.get(short);
      if (!parts) throw new Error(`Quadrant ${short} has no neighborhoods`);
      const merged = unionAll(parts.map((p) => [p] as PCMultiPolygon));
      const simplified = simplifyPolys(merged, QUADRANT_SIMPLIFY);
      features.push({
        type: 'Feature',
        geometry: roundPolys(simplified),
        properties: {
          id: `portland--${slugify(short)}`,
          name,
          shortName: short,
          region: region.name,
          level: 'area',
          aliases,
          labelPoint: LABEL_OVERRIDES[short] ?? labelPoint(simplified),
        },
      });
    }
  } else {
    const parts = await cityParts(region.name);
    features.push({
      type: 'Feature',
      geometry: roundPolys(parts),
      properties: {
        id: slugify(region.name),
        name: region.name,
        shortName: region.name,
        region: region.name,
        level: 'city',
        aliases: ALIASES[region.name] ?? [],
        labelPoint: labelPoint(parts),
      },
    });
  }
}

for (const name of FILL_CITIES) features.push(community(slugify(name), name, await cityParts(name)));
for (const name of FILL_COMMUNITIES) features.push(community(slugify(name), name, await censusPlaceParts(name)));

// Anything still enclosed by drawn shapes — unincorporated pockets the lists
// above don't name — becomes "Unincorporated <County> County", so nothing
// inside the map's outline is left blank.
{
  const outer = features.filter((f) => f.properties?.level !== 'neighborhood');
  const merged = unionAll(outer.map((f) => polys(f) as PCMultiPolygon));
  const counties = await query(COUNTY_LAYER, '1=1', 'COUNTY', QUADRANT_SIMPLIFY);
  const holesByCounty = new Map<string, Poly[]>();
  for (const poly of merged) {
    for (const hole of poly.slice(1)) {
      if (ringArea(hole) < MIN_HOLE_AREA) continue;
      const inside = labelPoint([[hole]]);
      const county = counties.find((c) => inPolys(inside, polys(c)))?.properties?.COUNTY;
      if (!county) continue;
      holesByCounty.set(county, [...(holesByCounty.get(county) ?? []), [hole]]);
    }
  }
  for (const [county, parts] of holesByCounty) {
    features.push(community(`unincorporated-${slugify(county)}`, `Unincorporated ${county} County`, parts));
  }
}

const out = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'data', 'map-regions.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify({
    type: 'FeatureCollection',
    // Surfaced in the map's attribution line.
    attribution: 'Boundaries: City of Portland Open Data, U.S. Census Bureau',
    features,
  })
);
const count = (level: string) => features.filter((f) => f.properties?.level === level).length;
console.log(
  `Wrote ${count('area')} quadrants, ${count('neighborhood')} neighborhoods, ${count('city')} cities, ` +
    `${count('community')} fill-in places to ${out}`
);
