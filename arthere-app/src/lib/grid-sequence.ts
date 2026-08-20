// Shared randomized-placement builder for the ambient artwork grids
// (CityGrid's city-page background, ArtworkBrowser's /artwork page). Each
// distinct image repeats a fixed number of times, shuffled into the grid so
// no two copies of the same image land in the same row or within a few rows
// of each other.

export interface RepeatItem<T> {
  /**
   * Identity used for spacing. Callers pass the *artist*, not the image src:
   * spacing by src still let two different pieces by the same artist sit
   * side by side, which is what the grids are trying to avoid.
   */
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
 * When `repeats > 1`, the result is padded out to a full multiple of `cols`
 * — a trailing row with fewer than `cols` items would otherwise render as
 * empty grid cells (visible blank space) rather than more artwork. Padding
 * picks are plain random extra repeats, still subject to the same spacing
 * check as everything else, so a piece can end up appearing more than
 * `repeats` times only when needed to fill out the last row.
 *
 * `repeats === 1` is treated as a hard cap instead — used for a filtered
 * result where every distinct piece must appear exactly once, never
 * duplicated to pad out a short trailing row.
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
  const targetLength = repeats > 1 ? Math.ceil(pool.length / cols) * cols : pool.length;
  while (pool.length < targetLength) {
    pool.push(items[Math.floor(Math.random() * items.length)]);
  }

  const remaining = shuffle(pool);

  // How many copies of each key are still unplaced. Used to break ties
  // toward the most plentiful key, which keeps variety available for the
  // later rows instead of burning through some keys early and leaving a
  // stretch at the end with nothing left but duplicates.
  const counts = new Map<string, number>();
  for (const item of remaining) counts.set(item.key, (counts.get(item.key) ?? 0) + 1);

  const lastRow = new Map<string, number>();
  const result: T[] = [];

  for (let i = 0; i < remaining.length; i++) {
    const row = Math.floor(i / cols);

    // Candidates fall into three tiers, best first:
    //   0 — fully spaced (>= minRowGap rows since this key last appeared)
    //   1 — inside the cooldown window, but not already in this row
    //   2 — already in this row (only when nothing else is left)
    // Tier 1 is the normal case whenever there are fewer distinct keys than
    // a `minRowGap`-row window can hold (cols * minRowGap tiles), which is
    // the usual situation for a city with a handful of artists.
    const spaced: number[] = [];
    let bestJ = -1;
    let bestTier = 3;
    let bestCount = -1;
    let bestLast = Infinity;

    for (let j = i; j < remaining.length; j++) {
      const key = remaining[j].key;
      const last = lastRow.get(key);
      const tier = last === undefined || row - last >= minRowGap ? 0 : last === row ? 2 : 1;
      if (tier === 0) {
        spaced.push(j);
        continue;
      }
      const count = counts.get(key) ?? 0;
      const lastVal = last ?? -1;
      if (tier < bestTier || (tier === bestTier && (count > bestCount || (count === bestCount && lastVal < bestLast)))) {
        bestTier = tier;
        bestCount = count;
        bestLast = lastVal;
        bestJ = j;
      }
    }

    // Pick at random among fully-spaced candidates so the grid stays varied
    // run to run; only fall through to the tiered choice when there are none.
    const chosenIdx = spaced.length > 0 ? spaced[Math.floor(Math.random() * spaced.length)] : bestJ;

    [remaining[i], remaining[chosenIdx]] = [remaining[chosenIdx], remaining[i]];
    const chosenKey = remaining[i].key;
    counts.set(chosenKey, (counts.get(chosenKey) ?? 1) - 1);
    lastRow.set(chosenKey, row);
    result.push(remaining[i].payload);
  }

  return result;
}
