/**
 * The single source of truth for the artwork-grid spacing rules.
 *
 * These are REQUIRED DESIGN FEATURES — see REQUIRED-DESIGN-FEATURES.md at
 * the repo root (rules GRID-1 … GRID-5). Both grids import from here, and
 * `src/lib/__tests__/required-design-features.test.ts` asserts the values
 * as well as the layouts they produce, so a change made here to make some
 * unrelated work easier fails CI instead of quietly shipping.
 */

/** How many times each image is repeated across an ambient (unfiltered) grid. */
export const GRID_REPEATS = 3;

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

/** Ambient /artwork view caps each artist to this many non-hero pieces. */
export const ARTWORK_CURATED_PER_ARTIST = 3;
