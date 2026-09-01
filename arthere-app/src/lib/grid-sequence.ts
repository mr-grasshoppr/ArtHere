// Shared randomized-placement builder for the ambient artwork grids
// (CityGrid's city-page background, ArtworkBrowser's /artwork page).
//
// ⚠️ The spacing this file produces is a REQUIRED DESIGN FEATURE, not a
// nicety — see REQUIRED-DESIGN-FEATURES.md at the repo root. It has been
// silently broken several times by unrelated changes (image sizing, filter
// work, curation caps), so `src/lib/__tests__/required-design-features.test.ts`
// re-simulates the real DOM geometry of both grids and fails CI if any of
// the guarantees regress. Do not weaken either file without the same care.
//
// Both grids are CSS `grid-auto-flow: row dense` with some cells spanning two
// rows (and, on city pages, one cell spanning two columns as well), so a
// sequence index says very little about where a tile actually lands. This
// builder therefore *simulates* that placement as it goes and enforces
// spacing against the resulting geometry, rather than against a
// `floor(i / cols)` approximation that the browser doesn't honour.

export interface RepeatItem<T> {
  /**
   * Coarse identity — the *artist*. Spacing by artwork alone still let two
   * different pieces by the same artist sit side by side, which is what the
   * grids are trying to avoid.
   */
  key: string;
  /**
   * Fine identity — this individual artwork. Defaults to `key`, but callers
   * should pass the image src: when a city has too few artists for full
   * artist separation, the artist rule degrades while the *artwork* rule
   * (the far more visible one) must still hold.
   */
  id?: string;
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
  /**
   * Footprint of the *first* tile when the caller renders it specially.
   * CityGrid turns sequence[0] into a 2-col × 2-row logo cell; without this
   * the planner models it as an ordinary one-column tile and every row
   * boundary after it is off by the difference.
   */
  leadCell?: { rowSpan: number; colSpan: number };
}

/**
 * Mirrors CSS `grid-auto-flow: row dense`: each tile goes to the first
 * row-major position its footprint fits, which is how the browser back-fills
 * the holes that spanning cells leave behind.
 */
class DensePacker {
  private rows: boolean[][] = [];

  constructor(private cols: number) {}

  private ensureRow(r: number) {
    while (this.rows.length <= r) this.rows.push(new Array(this.cols).fill(false));
  }

  private fits(r: number, c: number, rowSpan: number, colSpan: number): boolean {
    for (let k = 0; k < rowSpan; k++) {
      for (let m = 0; m < colSpan; m++) if (this.rows[r + k][c + m]) return false;
    }
    return true;
  }

  /** Row-major first fit, without mutating. */
  findRow(rowSpan: number, colSpan = 1): number {
    for (let r = 0; ; r++) {
      this.ensureRow(r + rowSpan - 1);
      for (let c = 0; c + colSpan <= this.cols; c++) if (this.fits(r, c, rowSpan, colSpan)) return r;
    }
  }

  place(rowSpan: number, colSpan = 1): number {
    for (let r = 0; ; r++) {
      this.ensureRow(r + rowSpan - 1);
      for (let c = 0; c + colSpan <= this.cols; c++) {
        if (!this.fits(r, c, rowSpan, colSpan)) continue;
        for (let k = 0; k < rowSpan; k++) for (let m = 0; m < colSpan; m++) this.rows[r + k][c + m] = true;
        return r;
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

/** Lexicographic compare of two equal-length rank tuples. Lower wins. */
function rankCompare(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Orders the pool's row-spans so each height is spread evenly through the
 * sequence rather than clustered — a plain shuffle regularly drops a knot of
 * tall cells into the last few rows, and once the grid is down to a handful
 * of tall pieces those slots have no choice but to repeat one on top of
 * another. Evenly spread, the same number of tall cells is always in reach
 * of enough distinct pieces to fill them.
 *
 * Each height accrues credit at its share of the pool and the largest
 * outstanding credit takes the next slot (the usual smooth-scheduling
 * construction). The starting credit is random, so the pattern's phase still
 * differs on every visit.
 */
function evenlySpreadSpans(counts: Map<number, number>, total: number): number[] {
  const kinds = [...counts.keys()];
  const left = kinds.map(k => counts.get(k)!);
  const rate = kinds.map(k => counts.get(k)! / total);
  const credit = kinds.map(() => Math.random());

  const order: number[] = [];
  for (let i = 0; i < total; i++) {
    let best = -1;
    for (let j = 0; j < kinds.length; j++) {
      credit[j] += rate[j];
      if (left[j] > 0 && (best === -1 || credit[j] > credit[best])) best = j;
    }
    if (best === -1) break;
    credit[best] -= 1;
    left[best]--;
    order.push(kinds[best]);
  }
  return order;
}

/** A cell of the planned grid, before it is given an artwork to show. */
interface Slot {
  rowSpan: number;
  colSpan: number;
  /** Span an item must have to be allowed here — tall art needs a tall cell. */
  itemSpan: number;
  row: number;
}

/** Rows `[top, bottom]` that one placed tile occupies. */
type Block = readonly [number, number];

/** Rows between two placed tiles; 0 when they share one. */
function blockDistance(a: Block, b: Block): number {
  if (a[0] > b[1]) return a[0] - b[1];
  if (b[0] > a[1]) return b[0] - a[1];
  return 0;
}

interface Plan<T> {
  sequence: T[];
  /** Closest any two tiles of one identity ended up, and how many are tight. */
  worstArtwork: number;
  worstArtist: number;
  tightArtwork: number;
  tightArtist: number;
}

/**
 * How many layouts to plan before keeping the best one.
 *
 * Re-planning fixes the greedy's weak spot — the last rows, where whatever
 * is left over has to go somewhere — and best-of-16 is measurably tighter
 * than best-of-1 on the small pools where that bites. But planning is
 * quadratic in pool size, so a big city would pay ~200ms on mount for
 * attempts it doesn't need: with hundreds of distinct pieces the rules are
 * satisfied comfortably on the first try. Scale the effort to the pool.
 */
function planAttempts(tiles: number): number {
  if (tiles <= 400) return 16;
  if (tiles <= 1000) return 4;
  return 2;
}

/**
 * Repeats every item `repeats` times and orders them so that, measured
 * against simulated grid placement (row-spans and the lead cell included):
 *
 *   1. no two tiles showing the same *artwork* share a row;
 *   2. no two tiles by the same *artist* share a row;
 *   3. the same artwork stays at least `minRowGap` rows apart;
 *   4. the same artist stays at least `minRowGap` rows apart.
 *
 * Rules 2 and 4 need enough variety to be satisfiable at all: a row holds
 * `cols` tiles and a `minRowGap` window holds about `cols * minRowGap` of
 * them, so an artist rule can only hold with that many distinct artists.
 * When it can't, placement degrades in exactly the order above — the artwork
 * rules are defended first, because a piece repeating near itself is the
 * violation a visitor actually notices.
 */
export function buildSpacedSequence<T>(items: RepeatItem<T>[], options: BuildOptions): T[] {
  if (items.length === 0 || options.repeats <= 0) return [];

  const cap = options.minRowGap;
  const attempts = planAttempts(items.length * options.repeats);
  let best: Plan<T> | null = null;
  let bestRank: number[] = [];
  for (let attempt = 0; attempt < attempts; attempt++) {
    const plan = planLayout(items, options);
    // Widest separation first, artwork before artist; then the fewest tiles
    // sitting closer than the rule asks for. Distances past the rule earn no
    // extra credit, so a layout isn't preferred for over-spreading one piece.
    const rank = [
      -Math.min(plan.worstArtwork, cap),
      -Math.min(plan.worstArtist, cap),
      plan.tightArtwork,
      plan.tightArtist,
    ];
    if (best === null || rankCompare(rank, bestRank) < 0) {
      best = plan;
      bestRank = rank;
    }
  }
  return best!.sequence;
}

/**
 * One candidate layout, in two passes.
 *
 * The first lays out *geometry* only: the pool fixes the multiset of
 * row-spans, `evenlySpreadSpans` fixes their order, and dense packing turns
 * that into slots with known rows. The second walks those slots **in row
 * order** and decides which artwork each one shows.
 *
 * Doing it in that order matters. A one-pass greedy picks whichever tile
 * scores best next, and since a tall tile can always be parked far down an
 * empty grid it will burn through every tall tile first and then have
 * nothing but crowded choices left to fill the rows it skipped over.
 */
function planLayout<T>(
  items: RepeatItem<T>[],
  { cols, repeats, minRowGap, padToFullRows = true, leadCell }: BuildOptions
): Plan<T> {
  const idOf = (it: RepeatItem<T>) => it.id ?? it.key;
  const spanOf = (it: RepeatItem<T>) => Math.max(1, it.span ?? 1);

  // ── Pass 1: geometry ──────────────────────────────────────────────────
  // Which spans exist is fixed by the pool; only their order varies, and
  // that order alone decides where every row boundary falls.
  const spanCounts = new Map<number, number>();
  for (const it of items) spanCounts.set(spanOf(it), (spanCounts.get(spanOf(it)) ?? 0) + repeats);
  const spans = evenlySpreadSpans(spanCounts, items.length * repeats);

  const packer = new DensePacker(cols);
  const slots: Slot[] = spans.map((span, i) => {
    // The caller renders the first tile specially (CityGrid's logo cell); it
    // still consumes one piece from the pool, so its item span is whatever
    // the spread put first, but its footprint is the caller's.
    const rowSpan = i === 0 && leadCell ? leadCell.rowSpan : span;
    const colSpan = i === 0 && leadCell ? leadCell.colSpan : 1;
    return { rowSpan, colSpan, itemSpan: span, row: packer.place(rowSpan, colSpan) };
  });

  // Top up until the bottom edge is flush. Padding slots are always span-1 so
  // they drop into the holes tall cells left behind rather than opening new
  // ones — which also means they can't move any slot already placed.
  const padFrom = slots.length;
  if (padToFullRows) {
    // Each padding tile fills exactly one hole, so the count is exact; the
    // guard only protects against a pathological input.
    let guard = packer.holeCount() + cols;
    while (packer.holeCount() > 0 && guard-- > 0) {
      slots.push({ rowSpan: 1, colSpan: 1, itemSpan: 1, row: packer.place(1, 1) });
    }
  }

  // ── Pass 2: which artwork goes in which slot ──────────────────────────
  // Where each identity has already been placed, as row blocks rather than a
  // single "last row": dense flow back-fills holes, so slots are not filled
  // in the order they were created and a distance measured only from the
  // most recent placement walks straight past the neighbour a tile actually
  // ends up sitting next to.
  const blocksById = new Map<string, Block[]>();
  const blocksByKey = new Map<string, Block[]>();

  // Copies still owed, per artwork and (summed) per artist.
  const idLeft = items.map(() => repeats);
  const keyLeft = new Map<string, number>();
  for (const it of items) keyLeft.set(it.key, (keyLeft.get(it.key) ?? 0) + repeats);

  const nearest = (placed: Block[] | undefined, block: Block): number => {
    if (!placed || placed.length === 0) return Infinity;
    let closest = Infinity;
    for (const other of placed) closest = Math.min(closest, blockDistance(block, other));
    return closest;
  };

  /** Placement penalty for showing item `i` in `block`. Lower is better. */
  const rankOf = (i: number, block: Block): number[] => {
    const it = items[i];
    const distId = nearest(blocksById.get(idOf(it)), block);
    const distKey = nearest(blocksByKey.get(it.key), block);
    // Sharing a row is the one thing that must never happen, and a piece
    // sharing a row with a copy of *itself* is worse than with a stablemate.
    const overlap = distKey === 0 ? (distId === 0 ? 2 : 1) : 0;
    return [
      overlap,
      Math.max(0, minRowGap - distId),
      Math.max(0, minRowGap - distKey),
      // Negated counts: "most copies still owed" sorts first. Reaching for
      // the scarcest-so-far piece is what stops the tail of a long grid
      // bunching up. Per-artwork before per-artist, because a slot only ever
      // draws from pieces of its own height and an artist's total says
      // little about how many of *those* they have left.
      -idLeft[i],
      -(keyLeft.get(it.key) ?? 0),
    ];
  };

  /**
   * Least-bad artwork for one slot. Ties are broken by reservoir sampling, so
   * the grid still looks different on every visit.
   */
  const choose = (eligible: (i: number) => boolean, block: Block): number => {
    let best = -1;
    let bestRank: number[] = [];
    let ties = 0;
    for (let i = 0; i < items.length; i++) {
      if (!eligible(i)) continue;
      const rank = rankOf(i, block);
      const cmp = best === -1 ? -1 : rankCompare(rank, bestRank);
      if (cmp < 0) {
        best = i;
        bestRank = rank;
        ties = 1;
      } else if (cmp === 0) {
        ties++;
        if (Math.random() * ties < 1) best = i;
      }
    }
    return best;
  };

  // Only pad with pieces that are naturally span-1: reusing a tall piece's
  // payload would render as a 2-row cell no matter what span the slot plans
  // for it, punching the hole straight back open.
  const shortItems = items.map((it, i) => (spanOf(it) === 1 ? i : -1)).filter(i => i >= 0);
  const padPool = new Set(shortItems.length > 0 ? shortItems : items.map((_, i) => i));

  const sequence: T[] = new Array(slots.length);
  const byRow = slots.map((_, i) => i).sort((a, b) => slots[a].row - slots[b].row || a - b);

  for (const s of byRow) {
    const slot = slots[s];
    const block: Block = [slot.row, slot.row + slot.rowSpan - 1];
    // Padding slots hand out *extra* appearances, so they must not spend the
    // pool's budget. They fill holes, and holes sit early in the grid, so in
    // row order they are reached long before the slots whose copies they
    // would otherwise take — leaving those slots to fall back on a tall
    // piece for a one-row cell, which drags the whole layout out of step
    // with the geometry it was planned against.
    const pad = s >= padFrom;
    let i = pad
      ? choose(j => padPool.has(j), block)
      : choose(j => idLeft[j] > 0 && spanOf(items[j]) === slot.itemSpan, block);
    // Only reachable with a degenerate pool (e.g. every piece is tall, so a
    // padding slot has no short piece to draw). Matching the span still comes
    // first: a mismatch here would render at the wrong height and shift every
    // tile below it off its planned row.
    if (i === -1) i = choose(j => spanOf(items[j]) === slot.itemSpan, block);
    if (i === -1) i = choose(() => true, block);

    const it = items[i];
    record(blocksById, idOf(it), block);
    record(blocksByKey, it.key, block);
    if (!pad && idLeft[i] > 0) {
      idLeft[i]--;
      keyLeft.set(it.key, (keyLeft.get(it.key) ?? 1) - 1);
    }
    sequence[s] = it.payload;
  }

  const artwork = closestPair(blocksById, minRowGap);
  const artist = closestPair(blocksByKey, minRowGap);
  return {
    sequence,
    worstArtwork: artwork.closest,
    worstArtist: artist.closest,
    tightArtwork: artwork.tight,
    tightArtist: artist.tight,
  };
}

function record(map: Map<string, Block[]>, label: string, block: Block): void {
  const blocks = map.get(label);
  if (blocks) blocks.push(block);
  else map.set(label, [block]);
}

/** Closest two tiles of any one identity ended up, and how many fall short. */
function closestPair(map: Map<string, Block[]>, minRowGap: number) {
  let closest = Infinity;
  let tight = 0;
  for (const blocks of map.values()) {
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const d = blockDistance(blocks[i], blocks[j]);
        if (d < closest) closest = d;
        if (d < minRowGap) tight++;
      }
    }
  }
  return { closest, tight };
}
