import { artistAppearanceBudget } from './grid-design';

// Shared randomized-placement builder for the ambient artwork grids
// (CityGrid on the city page, ambient and filtered).
//
// ⚠️ The spacing this file produces is a REQUIRED DESIGN FEATURE, not a
// nicety — see REQUIRED-DESIGN-FEATURES.md at the repo root. It has been
// silently broken several times by unrelated changes (image sizing, filter
// work, curation caps), so `src/lib/__tests__/required-design-features.test.ts`
// re-simulates the real DOM geometry of both grids and fails CI if any of
// the guarantees regress. Do not weaken either file without the same care.
//
// Both grids are CSS `grid-auto-flow: row dense` with some cells spanning two
// columns (heroes) and, on city pages, one lead cell spanning two of each, so a
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
  /** Rows this tile occupies (default 1). */
  span?: number;
  /** Columns this tile occupies (default 1) — 2 for a hero's wide cell. */
  colSpan?: number;
  /**
   * How many times this piece appears, overriding `BuildOptions.repeats`.
   *
   * Ambient grids use this to give every artist the same *number of
   * appearances* regardless of how much work they have uploaded — see
   * REQUIRED DESIGN FEATURES GRID-10. Repeating every piece the same number of
   * times instead hands an artist with twice the portfolio twice the
   * presence, and the surplus piles up at the end of the grid, where the
   * pool has drained to whoever had the most left.
   */
  repeats?: number;
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
  /**
   * Keep cells wider than one column at least this many rows apart (GRID-12).
   * A wide cell that would land closer is left out — its piece just comes
   * round fewer times — so only use this where appearances are flexible (an
   * ambient grid), never for a result set that must show every match.
   */
  minWideRowGap?: number;
  /**
   * With `minWideRowGap`: never more than this many wide cells in a row, top
   * to bottom, at the same position — left edge, right edge or in between
   * (GRID-13). Like the row gap, a wide cell that would break it waits for a
   * later spot, and is left out if none comes.
   */
  maxWideColumnRun?: number;
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
  findCell(rowSpan: number, colSpan = 1): { row: number; col: number } {
    for (let r = 0; ; r++) {
      this.ensureRow(r + rowSpan - 1);
      for (let c = 0; c + colSpan <= this.cols; c++) if (this.fits(r, c, rowSpan, colSpan)) return { row: r, col: c };
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

/**
 * Splits `total` appearances across `pieces` of one artist's work as evenly
 * as it goes: every piece gets `floor(total / pieces)`, and the remainder is
 * handed out one each to a random subset, so which pieces get the extra
 * turn differs from visit to visit.
 */
export function spreadAppearances(pieces: number, total: number): number[] {
  if (pieces <= 0) return [];
  const base = Math.floor(total / pieces);
  const out = new Array<number>(pieces).fill(base);
  // Fisher–Yates over the indices, then top up the first `extra` of them.
  const order = out.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let k = 0; k < total - base * pieces; k++) out[order[k]]++;
  return out;
}

/** One artist's work, as the pool builder takes it. */
export interface PoolGroup<T> {
  /** The artist — the identity two tiles must not share a row with. */
  key: string;
  items: { id: string; span?: number; colSpan?: number; payload: T }[];
}

/**
 * The pool an ambient grid draws from: every artist present the same number
 * of times, whatever the size of their portfolio (GRID-10), with that budget
 * shared out across their own pieces.
 *
 * This lives here, beside the planner, rather than in the component, because
 * it is half of what makes the spacing rules hold: the planner can only
 * spread what it is given, and a pool where one artist owns a third of the
 * tiles strands that artist in a block at the end of the grid, where the
 * pool has drained to whoever had the most left. That is exactly how the
 * rules broke in production while the guard tests — which only ever built
 * rosters where everyone had the same number of pieces — stayed green.
 *
 * A filtered view is a result set instead: every match exactly once (GRID-6).
 */
export function buildGridPool<T>(groups: PoolGroup<T>[], filtered: boolean): RepeatItem<T>[] {
  return groups.flatMap(group => {
    // Each piece three times, up to a full profile's worth of turns. An
    // artist holding more pieces than a profile allows — they predate the
    // limit — shares those same turns across all of them, so some pieces
    // come round twice and some once, and which is which changes on every
    // visit.
    const share = spreadAppearances(group.items.length, artistAppearanceBudget(group.items.length));
    return group.items.map((item, i) => ({
      key: group.key,
      id: item.id,
      span: item.span,
      colSpan: item.colSpan,
      repeats: filtered ? 1 : share[i],
      payload: item.payload,
    }));
  });
}

/** Appearances this piece gets — its own count, or the grid's default. */
function repeatsOf<T>(it: RepeatItem<T>, fallback: number): number {
  return Math.max(0, it.repeats ?? fallback);
}

/** Lexicographic compare of two equal-length rank tuples. Lower wins. */
function rankCompare(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Orders the pool's cell shapes so each is spread evenly through the
 * sequence rather than clustered — a plain shuffle regularly drops a knot of
 * hero cells into the last few rows, and once the grid is down to a handful
 * of heroes those slots have no choice but to repeat one beside another.
 * Evenly spread, the same number of hero cells is always in reach of enough
 * distinct pieces to fill them.
 *
 * Each height accrues credit at its share of the pool and the largest
 * outstanding credit takes the next slot (the usual smooth-scheduling
 * construction). The starting credit is random, so the pattern's phase still
 * differs on every visit.
 */
function evenlySpreadShapes<K>(counts: Map<K, number>, total: number): K[] {
  const kinds = [...counts.keys()];
  const left = kinds.map(k => counts.get(k)!);
  const rate = kinds.map(k => counts.get(k)! / total);
  const credit = kinds.map(() => Math.random());

  const order: K[] = [];
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
  /** Shape an item must have to be allowed here — a hero needs a hero's cell. */
  itemShape: string;
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
 * than best-of-1 on the small pools where that bites; a young city (a dozen
 * artists) gets 64, which buys it another row of separation at ~50ms. Fewer
 * isn't enough: at 24, a dozen artists on a 3-column grid still drew a layout
 * with an artist two rows from themselves in about 1 in 20 visits (the GRID-5
 * test caught it intermittently), and at 40 about 1 in 300. But planning is
 * quadratic in pool size, so a big city would pay ~200ms on mount for
 * attempts it doesn't need: with hundreds of distinct pieces the rules are
 * satisfied comfortably on the first try. Scale the effort to the pool.
 */
function planAttempts(tiles: number): number {
  if (tiles <= 150) return 64;
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
  const attempts = planAttempts(items.reduce((n, it) => n + repeatsOf(it, options.repeats), 0));
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
 * cell shapes, `evenlySpreadShapes` fixes their order, and dense packing turns
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
  { cols, repeats, minRowGap, padToFullRows = true, leadCell, minWideRowGap, maxWideColumnRun }: BuildOptions
): Plan<T> {
  const idOf = (it: RepeatItem<T>) => it.id ?? it.key;
  // A cell's footprint, as "rows x cols" — the key pieces are matched to
  // slots by. Never wider than the grid.
  const shapeOf = (it: RepeatItem<T>) =>
    `${Math.max(1, it.span ?? 1)}x${Math.min(cols, Math.max(1, it.colSpan ?? 1))}`;
  const footprint = (shape: string) => {
    const [rowSpan, colSpan] = shape.split('x').map(Number);
    return { rowSpan, colSpan };
  };

  // Copies owed, per artwork. Usually the plain repeat count — but where
  // wide cells are held apart (GRID-12) the grid only has room for so many,
  // and planning the rest only to drop them would leave the square pieces
  // packed tighter than the spacing rules allow. So the wide pieces' budget
  // is cut to fit first, before any shapes are laid out.
  const owed = items.map(it => repeatsOf(it, repeats));
  const isWide = (it: RepeatItem<T>) => footprint(shapeOf(it)).colSpan > 1;
  // Take `excess` copies back from the wide pieces among `owners` — evenly, a
  // turn at a time from whichever is owed most, ties broken at random — so no
  // one artist loses all their hero's appearances.
  const trimWide = (owners: number[], excess: number) => {
    while (excess > 0) {
      const most = owners.reduce((a, b) => (owed[b] > owed[a] || (owed[b] === owed[a] && Math.random() < 0.5) ? b : a));
      if (owed[most] === 0) break;
      owed[most]--;
      excess--;
    }
  };
  const wideOwners = items.map((it, i) => (isWide(it) ? i : -1)).filter(i => i >= 0);
  if (minWideRowGap && wideOwners.length > 0) {
    const cellsOf = (i: number) => {
      const { rowSpan, colSpan } = footprint(shapeOf(items[i]));
      return rowSpan * colSpan;
    };
    const otherCells = items.reduce((n, it, i) => n + (isWide(it) ? 0 : owed[i] * cellsOf(i)), 0);
    const wide = wideOwners.reduce((n, i) => n + owed[i], 0);
    const room = (w: number) => {
      // Rows the grid will run to with `w` wide cells (2 cells each, each in
      // place of one ordinary cell — see below), and so how many wide cells
      // fit one per `minWideRowGap` rows.
      const cells = otherCells - w + w * 2 + (leadCell ? leadCell.rowSpan * leadCell.colSpan - 1 : 0);
      return Math.floor(Math.ceil(cells / cols) / minWideRowGap);
    };
    let fit = wide;
    while (fit > 0 && fit > room(fit)) fit--;
    trimWide(wideOwners, wide - fit);
    // A hero that is shown takes one of its own artist's turns rather than
    // adding one: an extra turn would land between that artist's gallery
    // pieces, which now come round sooner without the heroes' room, and sit
    // them half as far apart as everyone else (GRID-5). So each hero turn
    // kept costs that artist a gallery turn, from whichever piece has most.
    for (const h of wideOwners) {
      const mates = items.map((it, i) => (it.key === items[h].key && !isWide(it) ? i : -1)).filter(i => i >= 0);
      for (let n = 0; n < owed[h] && mates.length > 0; n++) {
        const most = mates.reduce((a, b) => (owed[b] > owed[a] || (owed[b] === owed[a] && Math.random() < 0.5) ? b : a));
        if (owed[most] === 0) break;
        owed[most]--;
      }
    }
  }

  // ── Pass 1: geometry ──────────────────────────────────────────────────
  // Which shapes exist is fixed by the budget; only their order varies, and
  // that order alone decides where every row boundary falls.
  const shapeCounts = new Map<string, number>();
  let total = 0;
  items.forEach((it, i) => {
    shapeCounts.set(shapeOf(it), (shapeCounts.get(shapeOf(it)) ?? 0) + owed[i]);
    total += owed[i];
  });
  const shapes = evenlySpreadShapes(shapeCounts, total);
  // The lead cell draws a piece of whatever shape comes first and shows the
  // caller's tile instead, so where wide cells are scarce don't spend one
  // there — swap in the first ordinary shape.
  if (leadCell && minWideRowGap && footprint(shapes[0] ?? '1x1').colSpan > 1) {
    const k = shapes.findIndex(sh => footprint(sh).colSpan === 1);
    if (k > 0) [shapes[0], shapes[k]] = [shapes[k], shapes[0]];
  }

  const packer = new DensePacker(cols);
  const slots: Slot[] = [];
  // Wide cells placed so far, to hold them `minWideRowGap` apart (GRID-12)
  // and keep their positions varied (GRID-13). Checked against all of them,
  // in row order, not just the last placed: dense flow can drop a later cell
  // back into an earlier row.
  const wides: { row: number; side: string }[] = [];
  const sideOf = (col: number, colSpan: number) => (col === 0 ? 'left' : col + colSpan === cols ? 'right' : 'middle');
  const wideAllowed = (rowSpan: number, colSpan: number) => {
    const { row, col } = packer.findCell(rowSpan, colSpan);
    if (wides.some(w => Math.abs(w.row - row) < minWideRowGap!)) return null;
    const side = sideOf(col, colSpan);
    if (maxWideColumnRun) {
      const order = [...wides, { row, side }].sort((a, b) => a.row - b.row);
      let run = 0;
      for (let k = 0; k < order.length; k++) {
        run = k > 0 && order[k].side === order[k - 1].side ? run + 1 : 1;
        if (run > maxWideColumnRun) return null;
      }
    }
    return { row, side };
  };
  // Wide cells that couldn't go where the spread put them, waiting for the
  // next spot that keeps the rules.
  const waiting: string[] = [];
  const tryWide = (shape: string) => {
    const { rowSpan, colSpan } = footprint(shape);
    const ok = wideAllowed(rowSpan, colSpan);
    if (!ok) return false;
    wides.push(ok);
    slots.push({ rowSpan, colSpan, itemShape: shape, row: packer.place(rowSpan, colSpan) });
    return true;
  };
  shapes.forEach((shape, i) => {
    // The caller renders the first tile specially (CityGrid's logo cell); it
    // still consumes one piece from the pool, so its item shape is whatever
    // the spread put first, but its footprint is the caller's.
    const lead = i === 0 && !!leadCell;
    const { rowSpan, colSpan } = lead ? leadCell! : footprint(shape);
    if (!lead && colSpan > 1 && minWideRowGap) {
      if (!tryWide(shape)) waiting.push(shape);
      return;
    }
    if (waiting.length > 0 && tryWide(waiting[0])) waiting.shift();
    slots.push({ rowSpan, colSpan, itemShape: shape, row: packer.place(rowSpan, colSpan) });
  });
  // Any still waiting when the squares run out are left out: tacked on at
  // the end they'd crowd the last rows, which is where the grid loops.

  // Top up until the bottom edge is flush. Padding slots are always 1x1 so
  // they drop into the holes larger cells left behind rather than opening new
  // ones — which also means they can't move any slot already placed.
  const padFrom = slots.length;
  if (padToFullRows) {
    // Each padding tile fills exactly one hole, so the count is exact; the
    // guard only protects against a pathological input.
    let guard = packer.holeCount() + cols;
    while (packer.holeCount() > 0 && guard-- > 0) {
      slots.push({ rowSpan: 1, colSpan: 1, itemShape: '1x1', row: packer.place(1, 1) });
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

  // Copies still owed, per artwork and (summed) per artist. Any wide cells
  // left out above are copies nobody can be given: take them back the same
  // even way, or the scarcity tiebreak below would read an artist's
  // unplaceable hero copies as owed and hand them extra square tiles.
  {
    // Every slot of a shape takes one copy — the lead cell included, which
    // draws a piece of whatever shape the spread put first.
    const slotsOf = (shape: string) => slots.filter(sl => sl.itemShape === shape).length;
    for (const shape of new Set(wideOwners.map(i => shapeOf(items[i])))) {
      const owners = wideOwners.filter(i => shapeOf(items[i]) === shape);
      trimWide(owners, owners.reduce((n, i) => n + owed[i], 0) - slotsOf(shape));
    }
  }
  const idLeft = owed;
  const keyLeft = new Map<string, number>();
  items.forEach((it, i) => keyLeft.set(it.key, (keyLeft.get(it.key) ?? 0) + idLeft[i]));

  const nearest = (placed: Block[] | undefined, block: Block): number => {
    if (!placed || placed.length === 0) return Infinity;
    let closest = Infinity;
    for (const other of placed) closest = Math.min(closest, blockDistance(block, other));
    return closest;
  };

  // The grid's last row, so a slot knows how much room is left below it.
  const lastRow = slots.reduce((r, sl) => Math.max(r, sl.row + sl.rowSpan - 1), 0);

  /**
   * The spacing to hold a label to here: the rule, or as much of it as the
   * rows left can afford. A piece owed five more turns with ten rows to go
   * cannot be kept four rows clear of itself however it is placed, and
   * asking anyway starves it — it is passed over row after row for being
   * too close, until the end of the grid arrives and every copy it is still
   * owed has to go somewhere. That is how one artist ends up filling the
   * last rows, which is exactly where the ambient scroll loops back round.
   */
  const affordableGap = (left: number, row: number): number => {
    const rowsLeft = Math.max(1, lastRow - row + 1);
    return Math.max(1, Math.min(minRowGap, Math.floor(rowsLeft / Math.max(1, left))));
  };

  /**
   * The artist rule, unless the artist's own rhythm can't keep it: one owed
   * ten turns in forty-five rows averages four and a half rows apart, and
   * held to five early on they arrive at the last rows with turns still owed
   * and nowhere left to put them but beside themselves. So hold them to
   * their average. (A piece's few turns always fit; it keeps the rule.)
   */
  const comfortableGap = (left: number, row: number): number => {
    const rowsLeft = Math.max(1, lastRow - row + 1);
    return Math.max(1, Math.min(minRowGap, Math.round(rowsLeft / Math.max(1, left))));
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
      // First what this piece must have — the rule, or as much of it as the
      // rows left can afford — so nothing is starved into the last rows.
      Math.max(0, affordableGap(idLeft[i], block[0]) - distId),
      Math.max(0, affordableGap(keyLeft.get(it.key) ?? 1, block[0]) - distKey),
      // Then the rule itself, so a piece that could be given its four clear
      // rows still is, even where a tighter placement would be allowed.
      Math.max(0, minRowGap - distId),
      Math.max(0, comfortableGap(keyLeft.get(it.key) ?? 1, block[0]) - distKey),
      // Then whoever is owed the most, which is a round-robin through the
      // roster in all but name: every artist holds the same budget, so the
      // one who has waited longest is the one with the most left. It is
      // what keeps the last rows from being whatever drained slowest.
      -(keyLeft.get(it.key) ?? 0),
      // Then the same within that artist's own work.
      -idLeft[i],
    ];
  };

  /**
   * Least-bad artwork for one slot. Ties are broken by reservoir sampling, so
   * the grid still looks different on every visit.
   */
  const choose = (eligible: (i: number) => boolean, block: Block, uniform = false): number => {
    let best = -1;
    let bestRank: number[] = [];
    let ties = 0;
    for (let i = 0; i < items.length; i++) {
      if (!eligible(i)) continue;
      const rank = uniform ? [] : rankOf(i, block);
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

  // Only pad with pieces that are naturally 1x1: reusing a hero's payload
  // would render as a hero's cell no matter what shape the slot plans for
  // it, punching the hole straight back open.
  const shortItems = items.map((it, i) => (shapeOf(it) === '1x1' ? i : -1)).filter(i => i >= 0);
  const padPool = new Set(shortItems.length > 0 ? shortItems : items.map((_, i) => i));

  const sequence: T[] = new Array(slots.length);
  /** Which item each slot ended up showing, for the repair pass below. */
  const chosen: number[] = new Array(slots.length).fill(0);
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
    // The lead cell (the city page's logo tile) is drawn uniformly. Nothing
    // has been placed yet, so the spacing terms are all zero and the
    // scarcity tiebreak would hand it to whichever artist has the most
    // pieces — the same one on every visit.
    const uniform = s === 0 && !!leadCell;
    let i = pad
      ? choose(j => padPool.has(j), block)
      : choose(j => idLeft[j] > 0 && shapeOf(items[j]) === slot.itemShape, block, uniform);
    // The budget is a preference; the spacing rules are the rules. Towards
    // the end of a grid the pieces still owed are whatever drained slowest —
    // often one artist's, and for tall slots often one artist's hero — and
    // insisting on them puts that artist beside themselves in the last rows,
    // which is exactly where a visitor sees the grid loop. When someone
    // else's piece would sit better, spend an extra appearance on it.
    // Not for the lead cell, which is drawn uniformly (GRID-8), and not in
    // a filtered view, where the sequence is a result set and showing a
    // match twice would drop another one entirely (GRID-6). An ambient grid
    // is texture, and can afford one extra turn for a piece.
    if (!pad && !uniform && padToFullRows && i !== -1) {
      const spare = choose(j => shapeOf(items[j]) === slot.itemShape, block);
      if (spare !== -1 && rankCompare(rankOf(spare, block).slice(0, 4), rankOf(i, block).slice(0, 4)) < 0) {
        i = spare;
      }
    }
    // Only reachable with a degenerate pool (e.g. every piece is a hero, so a
    // padding slot has no 1x1 piece to draw). Matching the shape still comes
    // first: a mismatch here would render at the wrong size and shift every
    // tile after it off its planned place.
    if (i === -1) i = choose(j => shapeOf(items[j]) === slot.itemShape, block);
    if (i === -1) i = choose(() => true, block);

    const it = items[i];
    chosen[s] = i;
    record(blocksById, idOf(it), block);
    record(blocksByKey, it.key, block);
    if (!pad && idLeft[i] > 0) {
      idLeft[i]--;
      keyLeft.set(it.key, (keyLeft.get(it.key) ?? 1) - 1);
    }
    sequence[s] = it.payload;
  }

  repairSharedRows(slots, chosen, items, idOf, minRowGap);
  for (let i = 0; i < slots.length; i++) sequence[i] = items[chosen[i]].payload;
  blocksById.clear();
  blocksByKey.clear();
  for (let i = 0; i < slots.length; i++) {
    const block: Block = [slots[i].row, slots[i].row + slots[i].rowSpan - 1];
    record(blocksById, idOf(items[chosen[i]]), block);
    record(blocksByKey, items[chosen[i]].key, block);
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

/**
 * Last line of defence for the two rules that are absolute: no row shows one
 * artist twice, and no row shows one artwork twice (GRID-2, GRID-3).
 *
 * The planner fills slots in row order, so its choices narrow as it goes and
 * the last rows are left with whatever the pool still owes. Where that is one
 * artist's work, a row can end up with two of their pieces side by side.
 * Rather than accept it, trade that tile with one from a row far enough away
 * that neither row ends up worse — a swap costs nothing, because both slots
 * are the same shape and the pool is unchanged.
 */
function repairSharedRows<T>(
  slots: Slot[],
  chosen: number[],
  items: RepeatItem<T>[],
  idOf: (it: RepeatItem<T>) => string,
  minRowGap: number
): void {
  const rowsOf = (i: number): number[] => {
    const out: number[] = [];
    for (let r = slots[i].row; r < slots[i].row + slots[i].rowSpan; r++) out.push(r);
    return out;
  };
  // Row -> the slots that show something in it.
  const inRow = new Map<number, number[]>();
  for (let i = 0; i < slots.length; i++) {
    for (const r of rowsOf(i)) inRow.set(r, [...(inRow.get(r) ?? []), i]);
  }
  const labels = (i: number): [string, string] => [items[chosen[i]].key, idOf(items[chosen[i]])];

  /** Would showing `item` at slot `at` repeat an artist or a piece in its rows? */
  const clashes = (at: number, item: number, ignore: number): boolean => {
    const [key, id] = [items[item].key, idOf(items[item])];
    for (const r of rowsOf(at)) {
      for (const other of inRow.get(r) ?? []) {
        if (other === at || other === ignore) continue;
        const [k, d] = labels(other);
        if (k === key || d === id) return true;
      }
    }
    return false;
  };

  for (let i = 0; i < slots.length; i++) {
    if (!clashes(i, chosen[i], -1)) continue;
    for (let j = 0; j < slots.length; j++) {
      if (j === i || slots[j].itemShape !== slots[i].itemShape) continue;
      // Far enough apart that the swap cannot create a near-repeat of its own.
      if (Math.abs(slots[j].row - slots[i].row) < minRowGap) continue;
      if (clashes(i, chosen[j], j) || clashes(j, chosen[i], i)) continue;
      const tmp = chosen[i];
      chosen[i] = chosen[j];
      chosen[j] = tmp;
      break;
    }
  }
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
