// Shared randomized-placement builder for the ambient artwork grids
// (CityGrid's city-page background, ArtworkBrowser's /artwork page).
//
// Both grids are CSS `grid-auto-flow: row dense` with some cells spanning two
// rows, so a sequence index says very little about where a tile actually
// lands. This builder therefore *simulates* that placement as it goes and
// enforces spacing against the resulting geometry, rather than against a
// `floor(i / cols)` approximation that the browser doesn't honour.

export interface RepeatItem<T> {
  /**
   * Identity used for spacing. Callers pass the *artist*, not the image src:
   * spacing by src still let two different pieces by the same artist sit
   * side by side, which is what the grids are trying to avoid.
   */
  key: string;
  payload: T;
  /** Rows this tile occupies — 2 for a "tall" cell, otherwise 1. */
  span?: number;
}

export interface BuildOptions {
  cols: number;
  repeats: number;
  minRowGap: number;
  /**
   * Keep adding tiles until the final row has no gaps, so the grid ends on a
   * clean edge instead of a ragged one. Padding repeats existing pieces.
   */
  padToFullRows?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Mirrors CSS `grid-auto-flow: row dense` for single-column tiles of varying
 * row-span: each tile goes to the first row-major position it fits, which is
 * how the browser back-fills the holes that tall cells leave behind.
 */
class DensePacker {
  private rows: boolean[][] = [];

  constructor(private cols: number) {}

  private ensureRow(r: number) {
    while (this.rows.length <= r) this.rows.push(new Array(this.cols).fill(false));
  }

  /** Row-major first fit, without mutating. */
  findRow(span: number): number {
    for (let r = 0; ; r++) {
      this.ensureRow(r + span - 1);
      for (let c = 0; c < this.cols; c++) {
        let fits = true;
        for (let k = 0; k < span; k++) {
          if (this.rows[r + k][c]) {
            fits = false;
            break;
          }
        }
        if (fits) return r;
      }
    }
  }

  place(span: number): number {
    for (let r = 0; ; r++) {
      this.ensureRow(r + span - 1);
      for (let c = 0; c < this.cols; c++) {
        let fits = true;
        for (let k = 0; k < span; k++) {
          if (this.rows[r + k][c]) {
            fits = false;
            break;
          }
        }
        if (fits) {
          for (let k = 0; k < span; k++) this.rows[r + k][c] = true;
          return r;
        }
      }
    }
  }

  /**
   * Empty cells sitting above the grid's bottom edge — the holes that make a
   * grid end ragged. Each span-1 tile fills exactly one, so this doubles as
   * the exact number of padding tiles needed.
   */
  holeCount(): number {
    const last = this.lastOccupiedRow();
    if (last < 0) return 0;
    let holes = 0;
    for (let r = 0; r <= last; r++) {
      for (let c = 0; c < this.cols; c++) if (!this.rows[r][c]) holes++;
    }
    return holes;
  }

  private lastOccupiedRow(): number {
    for (let r = this.rows.length - 1; r >= 0; r--) {
      if (this.rows[r].some(Boolean)) return r;
    }
    return -1;
  }
}

/**
 * Repeats every item `repeats` times and orders them so that two tiles
 * sharing a key stay at least `minRowGap` rows apart — measured against
 * simulated grid placement, including the row-spans of tall cells.
 *
 * Full separation is only possible with at least `cols * minRowGap` distinct
 * keys, since that's how many tiles a `minRowGap`-row window holds. Below
 * that the constraint is mathematically unsatisfiable, so placement degrades
 * in a defined order: never overlap rows with the same key, then maximise the
 * gap, preferring whichever key has the most copies still unplaced so variety
 * lasts to the bottom of the grid.
 */
export function buildSpacedSequence<T>(
  items: RepeatItem<T>[],
  { cols, repeats, minRowGap, padToFullRows = true }: BuildOptions
): T[] {
  if (items.length === 0) return [];

  const pool: RepeatItem<T>[] = [];
  for (const item of items) {
    for (let r = 0; r < repeats; r++) pool.push(item);
  }

  const remaining = shuffle(pool);

  const counts = new Map<string, number>();
  for (const item of remaining) counts.set(item.key, (counts.get(item.key) ?? 0) + 1);

  const packer = new DensePacker(cols);
  // Last row each key occupies (its bottom edge, so tall cells count fully).
  const lastEnd = new Map<string, number>();
  const result: T[] = [];

  const spanOf = (it: RepeatItem<T>) => Math.max(1, it.span ?? 1);

  /** Rank a candidate: lower tier is better. */
  const tierOf = (key: string, row: number) => {
    const end = lastEnd.get(key);
    if (end === undefined) return 0;
    if (row - end >= minRowGap) return 0; // properly spaced
    if (row > end) return 1; // no row overlap, but inside the cooldown
    return 2; // shares a row with itself — last resort
  };

  const commit = (item: RepeatItem<T>) => {
    const span = spanOf(item);
    const row = packer.place(span);
    lastEnd.set(item.key, row + span - 1);
    counts.set(item.key, (counts.get(item.key) ?? 1) - 1);
    result.push(item.payload);
  };

  for (let i = 0; i < remaining.length; i++) {
    const spaced: number[] = [];
    let bestJ = -1;
    let bestTier = 3;
    let bestCount = -1;
    let bestEnd = Infinity;

    for (let j = i; j < remaining.length; j++) {
      const candidate = remaining[j];
      const row = packer.findRow(spanOf(candidate));
      const tier = tierOf(candidate.key, row);
      if (tier === 0) {
        spaced.push(j);
        continue;
      }
      const count = counts.get(candidate.key) ?? 0;
      const end = lastEnd.get(candidate.key) ?? -1;
      if (
        tier < bestTier ||
        (tier === bestTier && (count > bestCount || (count === bestCount && end < bestEnd)))
      ) {
        bestTier = tier;
        bestCount = count;
        bestEnd = end;
        bestJ = j;
      }
    }

    // Random among properly-spaced candidates keeps the grid varied run to
    // run; the tiered pick is only reached when none are available.
    const chosenIdx = spaced.length > 0 ? spaced[Math.floor(Math.random() * spaced.length)] : bestJ;
    [remaining[i], remaining[chosenIdx]] = [remaining[chosenIdx], remaining[i]];
    commit(remaining[i]);
  }

  if (padToFullRows) {
    // Top up until the bottom edge is flush. Padding tiles are always span-1
    // so they slot into the remaining holes rather than opening new ones.
    // Only pad with pieces that are naturally span-1. Reusing a tall piece's
    // payload here would render as a 2-row cell no matter what span we plan
    // for it, punching the hole straight back open.
    const shortItems = items.filter(it => (it.span ?? 1) === 1);
    const flatCandidates = shortItems.length > 0 ? shortItems : items;
    // Each padding tile is span-1 and lands in the earliest hole, so the
    // count is exact; the guard only protects against a pathological input.
    let guard = packer.holeCount() + cols;
    while (packer.holeCount() > 0 && guard-- > 0) {
      let best = flatCandidates[0];
      let bestTier = 3;
      let bestEnd = Infinity;
      const row = packer.findRow(1);
      for (const candidate of flatCandidates) {
        const tier = tierOf(candidate.key, row);
        const end = lastEnd.get(candidate.key) ?? -1;
        if (tier < bestTier || (tier === bestTier && end < bestEnd)) {
          bestTier = tier;
          bestEnd = end;
          best = candidate;
        }
      }
      commit(best);
    }
  }

  return result;
}
