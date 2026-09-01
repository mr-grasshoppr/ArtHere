/**
 * REQUIRED DESIGN FEATURES — artwork & city grids (GRID-1 … GRID-7).
 *
 * See REQUIRED-DESIGN-FEATURES.md at the repo root. These rules have been
 * broken several times by changes that had nothing to do with layout (image
 * sizing, filter work, curation caps), because nothing failed when they
 * were. This file is that failure.
 *
 * It does NOT check `buildSpacedSequence` against its own idea of where
 * tiles land. It re-simulates the browser's `grid-auto-flow: row dense`
 * placement — row spans, the city page's 2-col x 2-row logo cell, and all —
 * and asserts the rules against the rows that actually result.
 */
import { describe, it, expect } from "vitest";
import { buildSpacedSequence, type RepeatItem } from "../grid-sequence";
import {
  GRID_REPEATS,
  GRID_MIN_ROW_GAP,
  CITY_LOGO_CELL,
  GRID_COLS,
  ARTWORK_CURATED_PER_ARTIST,
} from "../grid-design";

interface Tile {
  artist: string;
  artwork: string;
  tall: boolean;
}

type Cell = Tile | "logo" | null;
type Footprint = { rowSpan: number; colSpan: number };

/** A city's artists, each with a hero plus `perArtist - 1` other pieces. */
function city(artists: number, perArtist: number): RepeatItem<Tile>[] {
  const pool: RepeatItem<Tile>[] = [];
  for (let a = 0; a < artists; a++) {
    for (let i = 0; i < perArtist; i++) {
      const tall = i === 0; // the artist's hero
      pool.push({
        key: `artist-${a}`,
        id: `artist-${a}/img-${i}`,
        span: tall ? 2 : 1,
        payload: { artist: `artist-${a}`, artwork: `artist-${a}/img-${i}`, tall },
      });
    }
  }
  return pool;
}

/**
 * Mirrors the browser: `grid-auto-flow: row dense`, one column per tile
 * except an optional leading cell that spans two of each.
 */
function layOut(sequence: Tile[], cols: number, lead?: Footprint): Cell[][] {
  const grid: Cell[][] = [];
  const ensure = (r: number) => {
    while (grid.length <= r) grid.push(new Array(cols).fill(null));
  };
  const put = (rowSpan: number, colSpan: number, fill: Tile | "logo") => {
    for (let r = 0; ; r++) {
      ensure(r + rowSpan - 1);
      for (let c = 0; c + colSpan <= cols; c++) {
        let fits = true;
        for (let k = 0; k < rowSpan && fits; k++) {
          for (let m = 0; m < colSpan; m++) if (grid[r + k][c + m]) fits = false;
        }
        if (!fits) continue;
        for (let k = 0; k < rowSpan; k++) for (let m = 0; m < colSpan; m++) grid[r + k][c + m] = fill;
        return;
      }
    }
  };

  let tiles = sequence;
  if (lead) {
    // CityGrid renders sequence[0] as the logo cell and the rest as artwork.
    put(lead.rowSpan, lead.colSpan, "logo");
    tiles = sequence.slice(1);
  }
  for (const tile of tiles) put(tile.tall ? 2 : 1, 1, tile);
  return grid;
}

/** Rows in which some label appears twice — the never-allowed case. */
function sameRowRepeats(grid: Cell[][], labelOf: (t: Tile) => string): number {
  let bad = 0;
  for (const row of grid) {
    const labels = row.filter((c): c is Tile => c !== null && c !== "logo").map(labelOf);
    if (new Set(labels).size !== labels.length) bad++;
  }
  return bad;
}

/**
 * Closest two appearances of any one label end up. Rows a single tall tile
 * occupies are one appearance, so they aren't counted as a repeat — but two
 * separate tiles landing on neighbouring rows are, which is the whole point.
 */
function closestRepeat(grid: Cell[][], labelOf: (t: Tile) => string): number {
  // Walked column by column, splitting each column into runs of one cell, so
  // a tall tile is recognised as the single tile it is. Reading rows instead
  // would have to guess whether two neighbouring rows are one tall tile or
  // two separate ones — and it is exactly the second case these rules are
  // about.
  const placements = new Map<string, [number, number][]>();
  for (let c = 0; c < (grid[0]?.length ?? 0); c++) {
    let r = 0;
    while (r < grid.length) {
      const cell = grid[r][c];
      if (cell === null || cell === "logo") {
        r++;
        continue;
      }
      let end = r;
      while (end + 1 < grid.length && grid[end + 1][c] === cell) end++;
      const label = labelOf(cell);
      const list = placements.get(label) ?? [];
      list.push([r, end]);
      placements.set(label, list);
      r = end + 1;
    }
  }

  let closest = Infinity;
  for (const list of placements.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [aTop, aBottom] = list[i];
        const [bTop, bBottom] = list[j];
        const d = aTop > bBottom ? aTop - bBottom : bTop > aBottom ? bTop - aBottom : 0;
        closest = Math.min(closest, d);
      }
    }
  }
  return closest;
}

interface Scenario {
  name: string;
  artists: number;
  pool: RepeatItem<Tile>[];
  repeats: number;
  padToFullRows: boolean;
  lead?: Footprint;
}

/** Every grid the site renders, in the shapes real cities produce. */
const SCENARIOS: Scenario[] = (() => {
  const out: Scenario[] = [];
  for (const artists of [4, 6, 10, 25]) {
    for (const perArtist of [2, 4]) {
      const full = city(artists, perArtist);
      const label = `${artists} artists x ${perArtist} pieces`;

      // City page: full pool, heroes render tall, logo cell leads.
      out.push({
        name: `CityGrid ${label}`,
        artists,
        pool: full,
        repeats: GRID_REPEATS,
        padToFullRows: true,
        lead: { ...CITY_LOGO_CELL },
      });

      // /artwork ambient: heroes dropped, capped per artist, padded flush.
      const curated: RepeatItem<Tile>[] = [];
      for (let a = 0; a < artists; a++) {
        curated.push(
          ...full
            .filter(it => it.key === `artist-${a}` && !it.payload.tall)
            .slice(0, ARTWORK_CURATED_PER_ARTIST)
        );
      }
      out.push({
        name: `Artwork ambient ${label}`,
        artists,
        pool: curated,
        repeats: GRID_REPEATS,
        padToFullRows: true,
      });

      // /artwork filtered: every match once, heroes included, no padding.
      out.push({
        name: `Artwork filtered ${label}`,
        artists,
        pool: full,
        repeats: 1,
        padToFullRows: false,
      });
    }
  }
  return out;
})();

const TRIALS = 8;

/** One laid-out grid per scenario, per column count, per trial. */
interface Sample {
  scenario: Scenario;
  cols: number;
  sequence: Tile[];
  grid: Cell[][];
}

const SAMPLES: Sample[] = (() => {
  const out: Sample[] = [];
  for (const cols of GRID_COLS) {
    for (const scenario of SCENARIOS) {
      for (let t = 0; t < TRIALS; t++) {
        const sequence = buildSpacedSequence(scenario.pool, {
          cols,
          repeats: scenario.repeats,
          minRowGap: GRID_MIN_ROW_GAP,
          padToFullRows: scenario.padToFullRows,
          leadCell: scenario.lead,
        });
        out.push({ scenario, cols, sequence, grid: layOut(sequence, cols, scenario.lead) });
      }
    }
  }
  return out;
})();

const where = (s: Sample) => `${s.scenario.name} @ ${s.cols} cols`;

/**
 * The separation a pool can actually deliver. A row holds `cols` tiles, so
 * `distinct` pieces can cover at most `distinct / cols` rows before one has
 * to come round again; past GRID_MIN_ROW_GAP we stop asking for more.
 *
 * A city barely bigger than the grid is wide is a different case. With only
 * a handful of artists, "no artist twice in a row" already decides most of
 * who goes where, and every hero pins its artist across two rows on top of
 * that — so the artwork rule takes what is left and the honest guarantee
 * drops to the same-row one. Portland is well past this; a city on its first
 * few sign-ups is not.
 */
function requiredArtworkGap(distinct: number, cols: number, artists: number): number {
  const pool = Math.min(GRID_MIN_ROW_GAP, Math.floor(distinct / cols));
  const roomy = artists >= cols + 2 && distinct >= cols * 3;
  return roomy ? pool : Math.min(pool, 1);
}

/**
 * Same idea for artists. Full separation needs real depth — roughly three
 * artists per column — because a hero already holds its artist across two
 * rows, so a thin roster has that artist back on screen almost immediately.
 * Under that, GRID-3's same-row rule is the whole guarantee.
 */
function requiredArtistGap(artists: number, cols: number): number {
  // With no more artists than columns there is nothing to promise at all —
  // see GRID-3, where the same threshold applies for the same reason.
  if (artists <= cols) return 0;
  const pool = Math.min(GRID_MIN_ROW_GAP, Math.floor(artists / cols));
  return artists >= cols * 3 ? pool : Math.min(pool, 1);
}

describe("REQUIRED DESIGN FEATURES — artwork & city grids", () => {
  it("GRID-1: the spacing rule is four clear rows (a gap of 5)", () => {
    // Pinned deliberately. A change that wants a different number changes
    // REQUIRED-DESIGN-FEATURES.md and this line together, on purpose.
    expect(GRID_MIN_ROW_GAP).toBe(5);
    expect(GRID_REPEATS).toBeGreaterThanOrEqual(1);
  });

  it("GRID-2: the same artwork never appears twice in one row", () => {
    for (const s of SAMPLES) {
      const distinct = new Set(s.scenario.pool.map(i => i.id)).size;
      if (distinct < s.cols) continue; // fewer pieces than columns — impossible
      expect(sameRowRepeats(s.grid, t => t.artwork), where(s)).toBe(0);
    }
  });

  it("GRID-3: no artist has two pieces in one row", () => {
    for (const s of SAMPLES) {
      // Needs at least one artist more than the grid is wide: with exactly
      // `cols` artists, every row must contain every artist exactly once and
      // a single tall cell is enough to make that impossible.
      if (s.scenario.artists <= s.cols) continue;
      expect(sameRowRepeats(s.grid, t => t.artist), where(s)).toBe(0);
    }
  });

  it("GRID-4: the same artwork stays four rows clear of itself", () => {
    for (const s of SAMPLES) {
      const distinct = new Set(s.scenario.pool.map(i => i.id)).size;
      const want = requiredArtworkGap(distinct, s.cols, s.scenario.artists);
      expect(closestRepeat(s.grid, t => t.artwork), where(s)).toBeGreaterThanOrEqual(want);
    }
  });

  it("GRID-5: an artist's work stays four rows clear of itself where the city allows", () => {
    for (const s of SAMPLES) {
      const want = requiredArtistGap(s.scenario.artists, s.cols);
      expect(closestRepeat(s.grid, t => t.artist), where(s)).toBeGreaterThanOrEqual(want);
    }
  });

  it("GRID-6: ambient grids end flush; filtered results are shown once each", () => {
    for (const s of SAMPLES) {
      if (s.scenario.padToFullRows) {
        for (const row of s.grid) expect(row.every(Boolean), where(s)).toBe(true);
      } else {
        // A filtered view is a result set, not texture: every match once.
        expect(s.sequence.length, where(s)).toBe(s.scenario.pool.length);
        expect(new Set(s.sequence.map(t => t.artwork)).size, where(s)).toBe(s.scenario.pool.length);
      }
    }
  });

  it("GRID-7: the city page's logo cell is planned as the 2x2 tile it renders as", () => {
    // The planner spaces against simulated geometry. If this stops matching
    // CityGrid.module.css (.logoCell: grid-column span 2 / grid-row span 2),
    // every row boundary below it drifts and the rules above become fiction.
    expect(CITY_LOGO_CELL).toEqual({ rowSpan: 2, colSpan: 2 });
  });
});
