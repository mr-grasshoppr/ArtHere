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
import { buildSpacedSequence, buildGridPool, type RepeatItem, type PoolGroup } from "../grid-sequence";
import {
  GRID_REPEATS,
  GRID_MIN_ROW_GAP,
  CITY_LOGO_CELL,
  GRID_COLS,
} from "../grid-design";

interface Tile {
  artist: string;
  artwork: string;
  tall: boolean;
}

type Cell = Tile | "logo" | null;
type Footprint = { rowSpan: number; colSpan: number };

/**
 * A city's artists, each with a hero plus some other pieces.
 *
 * `perArtist` may be a function of the artist's index, because a real city
 * is lopsided — Portland's most prolific artist has twice the median — and
 * a roster where everyone has the same number of pieces is precisely the
 * shape that hid a production bug: with per-piece repeats, that artist's
 * surplus ended up stacked in the last rows of the grid.
 */
function city(artists: number, perArtist: number | ((a: number) => number)): PoolGroup<Tile>[] {
  const groups: PoolGroup<Tile>[] = [];
  for (let a = 0; a < artists; a++) {
    const n = typeof perArtist === "function" ? perArtist(a) : perArtist;
    const items = [];
    for (let i = 0; i < n; i++) {
      const tall = i === 0; // the artist's hero
      items.push({
        id: `artist-${a}/img-${i}`,
        span: tall ? 2 : 1,
        payload: { artist: `artist-${a}`, artwork: `artist-${a}/img-${i}`, tall },
      });
    }
    groups.push({ key: `artist-${a}`, items });
  }
  return groups;
}

/** Portland's actual shape: a median, a long tail, and one artist with 2x. */
const lopsided = (median: number) => (a: number) =>
  a === 0 ? median * 2 : a === 1 ? median + 1 : a % 5 === 0 ? median - 1 : median;

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
  /** The artists' work, before the pool builder decides who appears how often. */
  groups: PoolGroup<Tile>[];
  filtered: boolean;
  repeats: number;
  padToFullRows: boolean;
  lead?: Footprint;
}

/** The pool the grid actually draws from — the production path, not a stand-in. */
const poolOf = (s: Scenario): RepeatItem<Tile>[] => buildGridPool(s.groups, s.filtered);

/** Every distinct piece in a scenario, however the pool shares them out. */
const distinctOf = (s: Scenario) => s.groups.reduce((n, g) => n + g.items.length, 0);

/** Every grid the site renders, in the shapes real cities produce. */
const SCENARIOS: Scenario[] = (() => {
  const out: Scenario[] = [];
  // 12 / 16 / 20 sit on the steps of GRID-5's ladder (see requiredArtistGap).
  for (const artists of [4, 6, 10, 12, 16, 20, 25]) {
    // Even rosters, and the lopsided ones real cities actually have.
    for (const perArtist of [2, 4, lopsided(4)] as const) {
      const full = city(artists, perArtist);
      const label =
        typeof perArtist === "function"
          ? `${artists} artists x lopsided`
          : `${artists} artists x ${perArtist} pieces`;

      // City page: full pool, heroes render tall, logo cell leads.
      out.push({
        name: `CityGrid ${label}`,
        artists,
        groups: full,
        filtered: false,
        repeats: GRID_REPEATS,
        padToFullRows: true,
        lead: { ...CITY_LOGO_CELL },
      });

      // Filtered: every match once, heroes included, no padding.
      out.push({
        name: `Filtered ${label}`,
        artists,
        groups: full,
        filtered: true,
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
        const sequence = buildSpacedSequence(poolOf(scenario), {
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
 * Same idea for artists, as a ladder: four clear rows where the city can
 * fill them, and otherwise the most it can — three, then two, then one,
 * then only GRID-3's same-row rule.
 *
 * These are measured floors, not arithmetic: the numbers come from running
 * the planner over lopsided rosters (2–6 pieces each, one artist with
 * double) and taking the worst result, then leaving a step of margin. A
 * real city usually lands a row above its floor.
 *
 *   4 cols: 5–10 artists → 1, 11 → 2, 12–14 → 3, 15–17 → 4, 18+ → 5
 *   3 cols: 5–6 → 1, 7–8 → 2, 9–10 → 3, 11–13 → 4, 14+ → 5
 */
const ARTIST_GAP_LADDER: Record<number, [number, number][]> = {
  // [fewer artists than this, guaranteed rows apart]
  3: [[7, 1], [9, 2], [11, 3], [14, 4]],
  4: [[11, 1], [12, 2], [15, 3], [18, 4]],
};

function requiredArtistGap(artists: number, cols: number): number {
  // With no more artists than columns there is nothing to promise at all —
  // see GRID-3, where the same threshold applies for the same reason.
  if (artists <= cols) return 0;
  for (const [upTo, gap] of ARTIST_GAP_LADDER[cols] ?? []) {
    if (artists < upTo) return gap;
  }
  return GRID_MIN_ROW_GAP;
}

/**
 * The other ceiling: a label that appears `k` times in a grid `rows` deep
 * can be at most `rows / k` rows from itself, however well it is placed.
 * Ambient grids keep every artist's `k` equal (GRID-10) so this is slack —
 * but a filtered result set is whatever matched, and an artist who owns a
 * fifth of the matches simply is on screen more often.
 */
function capacityGap(sample: Sample, labelOf: (t: Tile) => string): number {
  const counts = new Map<string, number>();
  for (const row of sample.grid) {
    for (const cell of row) if (cell && cell !== "logo") counts.set(labelOf(cell), (counts.get(labelOf(cell)) ?? 0) + 1);
  }
  // Cells, not tiles: a tall tile is counted twice above, which is right —
  // it occupies two rows' worth of the room being divided up.
  const busiest = Math.max(1, ...counts.values());
  return Math.floor((sample.grid.length * sample.cols) / busiest / sample.cols);
}

describe("REQUIRED DESIGN FEATURES — artwork & city grids", () => {
  it("GRID-10: every artist gets the same amount of an ambient grid", () => {
    // The rule this file exists to enforce, and the one it used to miss:
    // every roster it built gave each artist the same number of pieces, the
    // one shape in which per-piece repeats and per-artist appearances look
    // identical. In production one artist had twice the portfolio, drew
    // twice the tiles, and her surplus filled the last rows of the grid.
    for (const per of [2, 4, lopsided(4), (a: number) => 2 + (a % 7)]) {
      const pool = buildGridPool(city(12, per), false);
      const perArtist = new Map<string, number>();
      for (const item of pool) {
        perArtist.set(item.key, (perArtist.get(item.key) ?? 0) + (item.repeats ?? 0));
      }
      const shares = [...perArtist.values()];
      expect(new Set(shares).size, `shares: ${shares.join()}`).toBe(1);
      expect(shares[0]).toBeGreaterThanOrEqual(GRID_REPEATS);
    }

    // Deeper portfolios spend that budget on a different selection each
    // time, so the work still all reaches the grid — over visits, not at
    // anyone else's expense within one.
    const deep = city(12, a => (a === 0 ? 9 : 3));
    const seen = new Set<string>();
    for (let t = 0; t < 40; t++) {
      for (const item of buildGridPool(deep, false)) {
        if (item.key === "artist-0" && (item.repeats ?? 0) > 0) seen.add(item.id!);
      }
    }
    expect(seen.size).toBe(9);
  });

  it("GRID-1: the spacing rule is four clear rows (a gap of 5)", () => {
    // Pinned deliberately. A change that wants a different number changes
    // REQUIRED-DESIGN-FEATURES.md and this line together, on purpose.
    expect(GRID_MIN_ROW_GAP).toBe(5);
    expect(GRID_REPEATS).toBeGreaterThanOrEqual(1);
  });

  it("GRID-2: the same artwork never appears twice in one row", () => {
    for (const s of SAMPLES) {
      const distinct = distinctOf(s.scenario);
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
      const distinct = distinctOf(s.scenario);
      const want = Math.min(
        requiredArtworkGap(distinct, s.cols, s.scenario.artists),
        capacityGap(s, t => t.artwork)
      );
      expect(closestRepeat(s.grid, t => t.artwork), where(s)).toBeGreaterThanOrEqual(want);
    }
  });

  it("GRID-5: an artist's work stays four rows clear of itself, or as many as the city allows", () => {
    for (const s of SAMPLES) {
      // A filtered view is whatever matched: if one artist owns a third of
      // the results they are on screen a third of the time, and no ordering
      // changes that. The same-row rules (GRID-3) still hold there.
      const want = s.scenario.filtered
        ? // Same threshold as GRID-3: with no more artists than columns,
          // every row holds every artist and there is nothing to promise.
          (s.scenario.artists > s.cols ? 1 : 0)
        : Math.min(requiredArtistGap(s.scenario.artists, s.cols), capacityGap(s, t => t.artist));
      expect(closestRepeat(s.grid, t => t.artist), where(s)).toBeGreaterThanOrEqual(want);
    }
  });

  it("GRID-6: ambient grids end flush; filtered results are shown once each", () => {
    for (const s of SAMPLES) {
      if (s.scenario.padToFullRows) {
        for (const row of s.grid) expect(row.every(Boolean), where(s)).toBe(true);
      } else {
        // A filtered view is a result set, not texture: every match once.
        expect(s.sequence.length, where(s)).toBe(distinctOf(s.scenario));
        expect(new Set(s.sequence.map(t => t.artwork)).size, where(s)).toBe(distinctOf(s.scenario));
      }
    }
  });

  it("GRID-7: the city page's logo cell is planned as the 2x2 tile it renders as", () => {
    // The planner spaces against simulated geometry. If this stops matching
    // CityGrid.module.css (.logoCell: grid-column span 2 / grid-row span 2),
    // every row boundary below it drifts and the rules above become fiction.
    expect(CITY_LOGO_CELL).toEqual({ rowSpan: 2, colSpan: 2 });
  });

  it("GRID-8: the logo cell's artwork is drawn at random, not from the most prolific artist", () => {
    // Nothing is placed before the lead cell, so every spacing term is zero
    // and the scarcity tiebreak alone would decide it — handing the tile to
    // whichever artist has the most pieces, on every single visit.
    const pool: RepeatItem<Tile>[] = [];
    for (let a = 0; a < 6; a++) {
      const n = a === 0 ? 8 : 2; // one artist with far more work than the rest
      for (let i = 0; i < n; i++) {
        pool.push({ key: `artist-${a}`, id: `art-${a}-${i}`, span: 1, payload: { artist: `artist-${a}`, artwork: `art-${a}-${i}`, tall: false } });
      }
    }
    const leads = new Set<string>();
    for (let t = 0; t < 60; t++) {
      const seq = buildSpacedSequence(pool, { cols: 4, repeats: 3, minRowGap: GRID_MIN_ROW_GAP, leadCell: CITY_LOGO_CELL });
      leads.add(seq[0].artist);
    }
    expect(leads.size).toBeGreaterThan(1);
  });
});
