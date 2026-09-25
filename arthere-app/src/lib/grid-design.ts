/**
 * The single source of truth for the artwork-grid spacing rules.
 *
 * These are REQUIRED DESIGN FEATURES — see REQUIRED-DESIGN-FEATURES.md at
 * the repo root (rules GRID-1 … GRID-5). Both grids import from here, and
 * `src/lib/__tests__/required-design-features.test.ts` asserts the values
 * as well as the layouts they produce, so a change made here to make some
 * unrelated work easier fails CI instead of quietly shipping.
 */

import { MAX_ARTWORK_IMAGES } from './artist-options';

/** How many times each of an artist's pieces goes round an ambient grid. */
export const GRID_REPEATS = 3;

/**
 * How many times one artist's work appears in an ambient grid — REQUIRED
 * DESIGN FEATURES GRID-10. Uploading more work than a profile holds is
 * never a reason to take up more of the grid than anyone else.
 */
export function artistAppearanceBudget(pieces: number): number {
  // Every piece goes round the grid `GRID_REPEATS` times, and a profile
  // holds `MAX_ARTWORK_IMAGES` pieces — so a full profile is on screen
  // MAX_ARTWORK_IMAGES * GRID_REPEATS times and that is the ceiling.
  //
  // The ceiling is what keeps the profiles that predate the limit from
  // taking more of the grid than anyone else: an artist with eight pieces
  // gets the same twelve turns as an artist with four, shared out across
  // eight pieces instead of four. An artist with fewer than four pieces
  // gets three turns each rather than having them stretched.
  return Math.max(1, GRID_REPEATS * Math.min(Math.max(1, pieces), MAX_ARTWORK_IMAGES));
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
