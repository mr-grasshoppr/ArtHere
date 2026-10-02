// Orders artwork so you see many artists' work early and no artist's pieces
// touch — used by the map's region panel, whose artwork shows as a sideways
// row on a phone and a three-column grid on wider screens.
//
// Not the city page's grid builder (grid-sequence.ts): that one simulates a
// dense CSS grid with tall tiles and repeats. This is a plain list.

/**
 * Positions back from the current one that mustn't share its artist: 1 is the
 * piece beside it, 3 is the piece directly above it in a three-column grid.
 */
const NEIGHBOR_OFFSETS = [1, 3];

// How many placements the search may try before settling for the greedy
// order — far more than a region panel ever needs (a few dozen pieces), but a
// hard ceiling so a very large or impossible mix can't stall the page.
const SEARCH_BUDGET = 20000;

/**
 * Reorders `items` so that, wherever there's any arrangement that allows it,
 * no two pieces by the same artist are neighbors (side by side, or one above
 * the other in a three-column grid), and artists take turns rather than
 * running in blocks.
 *
 * A depth-first search: each step tries the eligible artists with the most
 * pieces left first — which spreads a prolific artist evenly instead of
 * leaving a clump of theirs at the end — with ties shuffled so the order
 * changes visit to visit, and backs up when a choice leads to a dead end.
 * Taking "most left" greedily without backing up gets stuck surprisingly
 * often (2, 2 and 1 pieces is enough). Each artist's own pieces keep their
 * order (their hero first). If no arrangement avoids every neighbor pair —
 * one artist has most of the pieces — the best greedy order is returned.
 */
export function mixByArtist<T>(items: T[], artistOf: (item: T) => string, random: () => number = Math.random): T[] {
  const queues = new Map<string, T[]>();
  for (const item of items) {
    const key = artistOf(item);
    queues.set(key, [...(queues.get(key) ?? []), item]);
  }
  const keys = [...queues.keys()];
  const left = new Map(keys.map((k) => [k, queues.get(k)!.length]));
  const placed: string[] = [];
  let budget = SEARCH_BUDGET;

  /** Artists to try next, best first; `strict` drops any that would touch. */
  const candidates = (strict: boolean) => {
    const blocked = new Set(NEIGHBOR_OFFSETS.map((o) => placed[placed.length - o]).filter(Boolean));
    return keys
      .filter((k) => left.get(k)! > 0 && (!strict || !blocked.has(k)))
      .map((k) => ({ k, n: left.get(k)!, tie: random() }))
      .sort((a, b) => b.n - a.n || a.tie - b.tie)
      .map((c) => c.k);
  };

  const search = (): boolean => {
    if (placed.length === items.length) return true;
    if (--budget < 0) return false;
    for (const k of candidates(true)) {
      placed.push(k);
      left.set(k, left.get(k)! - 1);
      if (search()) return true;
      placed.pop();
      left.set(k, left.get(k)! + 1);
    }
    return false;
  };

  if (!search()) {
    // No clean arrangement (or out of budget): greedy, allowing a touch only
    // when nothing else is left.
    placed.length = 0;
    for (const k of keys) left.set(k, queues.get(k)!.length);
    while (placed.length < items.length) {
      const [k] = candidates(true).length > 0 ? candidates(true) : candidates(false);
      placed.push(k);
      left.set(k, left.get(k)! - 1);
    }
  }

  const next = new Map(keys.map((k) => [k, 0]));
  return placed.map((k) => {
    const i = next.get(k)!;
    next.set(k, i + 1);
    return queues.get(k)![i];
  });
}
