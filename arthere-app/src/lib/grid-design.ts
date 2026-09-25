/**
 * The single source of truth for the artwork-grid spacing rules.
 *
 * These are REQUIRED DESIGN FEATURES — see REQUIRED-DESIGN-FEATURES.md at
 * the repo root (rules GRID-1 … GRID-5). Both grids import from here, and
 * `src/lib/__tests__/required-design-features.test.ts` asserts the values
 * as well as the layouts they produce, so a change made here to make some
 * unrelated work easier fails CI instead of quietly shipping.
 */

/**
 * How many times a *typical* artist's work goes round an ambient
 * (unfiltered) grid. It sets the grid's length: the appearance budget every
 * artist gets is this times the median artist's piece count.
 */
export const GRID_REPEATS = 3;

/**
 * The ambient grid shows every artist the same number of times, whatever
 * the size of their portfolio — REQUIRED DESIGN FEATURES GRID-10.
 *
 * `budget` is that shared number of appearances: `GRID_REPEATS` passes over
 * the median artist's work. An artist with more pieces than the budget still
 * shows each piece once, so uploading more work is never a reason to be
 * *less* visible — it just isn't a reason to be more visible either.
 */
export function artistAppearanceBudget(pieceCounts: number[]): number {
  if (pieceCounts.length === 0) return GRID_REPEATS;
  // Set by the artist with the least work: `GRID_REPEATS` turns through
  // *their* pieces. Anyone deeper spends the same budget on a random
  // selection of theirs, so the grid draws on all of it across visits
  // without anyone taking up more of one visit than anyone else.
  //
  // Sharing out a bigger budget instead — the median artist's, say — means
  // the thinnest artists run dry first, and a grid whose pool has drained
  // unevenly ends in a block of whoever is left. That is the bug this
  // rule exists to prevent, so the floor is what everyone can match.
  return Math.max(1, GRID_REPEATS * Math.min(...pieceCounts));
}

/**
 * Minimum row distance between two appearances of the same artwork, and
 * between two pieces by the same artist. A gap of 5 means four clear rows
 * in between — "never within four rows of itself".
 */
export const GRID_MIN_ROW_GAP = 5;

/** CityGrid renders sequence[0] as a 2-col x 2-row logo cell. */
export const CITY_LOGO_CELL = { rowSpan: 2, colSpan: 2 } as const;

/** Column counts each grid renders at, narrow breakpoint first. */
export const GRID_COLS = [3, 4] as const;
