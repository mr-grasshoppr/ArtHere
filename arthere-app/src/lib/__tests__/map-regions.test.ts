import { describe, it, expect } from 'vitest';
import { countArtistsByRegion, type MapRegionProperties } from '../map-regions';
import regionsJson from '@/data/map-regions.json';

const region = (id: string, name: string, aliases: string[] = []): MapRegionProperties => ({
  id,
  name,
  region: 'Portland',
  level: 'neighborhood',
  aliases,
});

const regions = [
  { ...region('sw', 'Southwest Portland', ['SW Portland']), level: 'area' as const },
  { ...region('multnomah', 'Multnomah', ['Multnomah Village']), parent: 'sw' },
  { ...region('bridlemile', 'Bridlemile'), parent: 'sw' },
  { ...region('beaverton', 'Beaverton'), level: 'city' as const, region: 'Beaverton' },
];

const counts = (stats: Record<string, { count: number }>) =>
  Object.fromEntries(Object.entries(stats).map(([id, s]) => [id, s.count]));

describe('countArtistsByRegion', () => {
  it('matches official names and aliases, case-insensitively', () => {
    const { stats } = countArtistsByRegion(regions, [['Multnomah Village'], ['bridlemile'], ['Beaverton']]);
    expect(counts(stats)).toEqual({ multnomah: 1, bridlemile: 1, beaverton: 1, sw: 2 });
  });

  it('counts an artist once per region even if they name it twice', () => {
    const { stats } = countArtistsByRegion(regions, [['Multnomah', 'Multnomah Village'], ['Multnomah Village']]);
    expect(stats.multnomah.count).toBe(2);
  });

  it('keeps the names artists typed, so the artist grid filter can match them', () => {
    const { stats } = countArtistsByRegion(regions, [['Multnomah'], ['Multnomah Village'], ['Multnomah Village']]);
    expect(stats.multnomah.names).toEqual(['Multnomah', 'Multnomah Village']);
  });

  it('counts an artist in every region they list', () => {
    const { stats } = countArtistsByRegion(regions, [['Bridlemile', 'Beaverton']]);
    expect(counts(stats)).toEqual({ bridlemile: 1, beaverton: 1, sw: 1 });
  });

  it("counts a neighborhood's artists toward its quadrant, once each", () => {
    const { stats } = countArtistsByRegion(regions, [['Multnomah', 'Bridlemile'], ['SW Portland'], ['Bridlemile']]);
    expect(stats.sw.count).toBe(3);
    expect(stats.sw.names).toEqual(['Multnomah', 'Bridlemile', 'SW Portland']);
  });

  it('reports answers that match no drawn shape as unplaced rather than guessing', () => {
    const { stats, unplaced } = countArtistsByRegion(regions, [['Portland'], [], ['Bridlemile']]);
    expect(counts(stats)).toEqual({ bridlemile: 1, sw: 1 });
    expect(unplaced).toBe(2);
  });
});

describe('map-regions.json', () => {
  const props = (regionsJson as unknown as { features: { properties: MapRegionProperties }[] }).features.map(
    (f) => f.properties
  );

  it('has unique ids', () => {
    const ids = props.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('draws the labeled satellite cities as single whole-city shapes', () => {
    for (const city of [
      'Beaverton', 'Tigard', 'Lake Oswego', 'Milwaukie', 'Vancouver',
      'West Linn', 'Gresham', 'Tualatin', 'Oregon City', 'Hillsboro',
    ]) {
      const matches = props.filter((p) => p.region === city);
      expect(matches, city).toHaveLength(1);
      expect(matches[0].level).toBe('city');
    }
  });

  it('resolves the neighborhood names already in use on the site', () => {
    const { unplaced } = countArtistsByRegion(props, [
      ['Multnomah Village'],
      ['Bridlemile'],
      ['Maplewood'],
      ['Hillsdale'],
      ['Sylvan Heights'],
      ['Alberta Arts District'],
      ['West End'],
      ['Hawthorne'],
      ['Beaverton'],
      ['Tigard'],
      ['Lake Oswego'],
      ['Hillsboro'],
      ['SW Portland'],
      ['NW Portland'],
      ['SE Portland'],
    ]);
    expect(unplaced).toBe(0);
  });

  it('files every Portland neighborhood under one of the five quadrants', () => {
    const quadrants = props.filter((p) => p.level === 'area');
    expect(quadrants.map((q) => q.shortName).sort()).toEqual(['N', 'NE', 'NW', 'SE', 'SW']);
    const ids = new Set(quadrants.map((q) => q.id));
    for (const n of props.filter((p) => p.level === 'neighborhood')) expect(ids.has(n.parent!), n.name).toBe(true);
  });
});
