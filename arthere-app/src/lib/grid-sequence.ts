// Shared randomized-placement builder for the ambient artwork grids
// (CityGrid's city-page background, ArtworkBrowser's /artwork page). Each
// distinct image repeats a fixed number of times, shuffled into the grid so
// no two copies of the same image land in the same row or within a few rows
// of each other.

export interface RepeatItem<T> {
  /** Identity used for spacing — typically the image src. */
  key: string;
  payload: T;
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
 * Repeats every item `repeats` times and shuffles them into a sequence such
 * that no two copies of the same key fall in the same row, or within
 * `minRowGap` rows of each other. Row is approximated as
 * `floor(position / cols)` — close enough for spacing purposes even where a
 * "tall" (row-spanning) cell nudges the true visual row by one.
 *
 * The result is always padded out to a full multiple of `cols` — a trailing
 * row with fewer than `cols` items would otherwise render as empty grid
 * cells (visible blank space) rather than more artwork. Padding picks are
 * plain random extra repeats, still subject to the same spacing check as
 * everything else, so a piece can end up appearing more than `repeats`
 * times only when needed to fill out the last row.
 *
 * Uses a greedy forward-scan: at each position, picks a random not-yet-placed
 * item whose key is out of its cooldown window. If every remaining item is
 * still cooling down (only possible with very few distinct keys relative to
 * cols/minRowGap), falls back to the least-recently-placed key rather than
 * looping forever — a soft violation instead of a hang.
 */
export function buildSpacedSequence<T>(
  items: RepeatItem<T>[],
  { cols, repeats, minRowGap }: { cols: number; repeats: number; minRowGap: number }
): T[] {
  if (items.length === 0) return [];

  const pool: RepeatItem<T>[] = [];
  for (const item of items) {
    for (let r = 0; r < repeats; r++) pool.push(item);
  }
  const targetLength = Math.ceil(pool.length / cols) * cols;
  while (pool.length < targetLength) {
    pool.push(items[Math.floor(Math.random() * items.length)]);
  }

  const remaining = shuffle(pool);

  const lastRow = new Map<string, number>();
  const result: T[] = [];

  for (let i = 0; i < remaining.length; i++) {
    const row = Math.floor(i / cols);
    const validIdxs: number[] = [];
    for (let j = i; j < remaining.length; j++) {
      const last = lastRow.get(remaining[j].key);
      if (last === undefined || row - last >= minRowGap) validIdxs.push(j);
    }

    let chosenIdx: number;
    if (validIdxs.length > 0) {
      chosenIdx = validIdxs[Math.floor(Math.random() * validIdxs.length)];
    } else {
      // Deadlock fallback: every remaining key is still cooling down (only
      // happens with very few distinct images) — take whichever was placed
      // longest ago to minimize the violation.
      let bestJ = i;
      let bestLast = Infinity;
      for (let j = i; j < remaining.length; j++) {
        const last = lastRow.get(remaining[j].key) ?? -Infinity;
        if (last < bestLast) {
          bestLast = last;
          bestJ = j;
        }
      }
      chosenIdx = bestJ;
    }

    [remaining[i], remaining[chosenIdx]] = [remaining[chosenIdx], remaining[i]];
    lastRow.set(remaining[i].key, row);
    result.push(remaining[i].payload);
  }

  return result;
}
