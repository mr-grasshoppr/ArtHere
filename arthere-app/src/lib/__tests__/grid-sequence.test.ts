import { describe, it, expect } from "vitest";
import { buildSpacedSequence, type RepeatItem } from "../grid-sequence";

function items(n: number): RepeatItem<string>[] {
  return Array.from({ length: n }, (_, i) => ({ key: `img-${i}`, payload: `img-${i}` }));
}

describe("buildSpacedSequence", () => {
  it("returns nothing for an empty input", () => {
    expect(buildSpacedSequence([], { cols: 4, repeats: 3, minRowGap: 5 })).toEqual([]);
  });

  it("pads a short result up to a full row instead of leaving it incomplete", () => {
    // 2 distinct items x 3 repeats = 6, not a multiple of 4 — this is exactly
    // the artwork-page scenario that left 2 empty cells at the bottom.
    const result = buildSpacedSequence(items(2), { cols: 4, repeats: 3, minRowGap: 5 });
    expect(result.length).toBe(8);
    expect(result.length % 4).toBe(0);
  });

  it("never repeats a piece when padding is off", () => {
    // The filtered artwork view: every matching piece appears exactly once,
    // even when that leaves the bottom row ragged. Padding it out would mean
    // showing the same image twice under a medium filter, which reads as a
    // bug — and did.
    for (const n of [1, 2, 3, 5, 7, 9]) {
      const result = buildSpacedSequence(items(n), {
        cols: 4,
        repeats: 1,
        minRowGap: 5,
        padToFullRows: false,
      });
      expect(result.length).toBe(n);
      expect(new Set(result).size).toBe(n);
    }
  });

  it("leaves an already-even pool alone", () => {
    const result = buildSpacedSequence(items(4), { cols: 4, repeats: 3, minRowGap: 5 });
    expect(result.length).toBe(12);
  });

  it("always returns a multiple of cols across a range of pool sizes", () => {
    for (let n = 1; n <= 9; n++) {
      const result = buildSpacedSequence(items(n), { cols: 4, repeats: 3, minRowGap: 5 });
      expect(result.length % 4).toBe(0);
      expect(result.length).toBeGreaterThanOrEqual(n * 3);
    }
  });

  it("shows every piece at least once when repeats is 1 (a filtered result)", () => {
    // Filtered views used to be left ragged on purpose, to avoid repeating a
    // piece the user had just filtered for. That was reversed deliberately:
    // a flush bottom edge is wanted even at the cost of duplicates.
    for (let n = 1; n <= 9; n++) {
      const result = buildSpacedSequence(items(n), { cols: 4, repeats: 1, minRowGap: 5 });
      expect(new Set(result).size).toBe(n);
      expect(result.length).toBeGreaterThanOrEqual(n);
    }
  });

  it("leaves no gaps in the final row, with or without tall cells", () => {
    const cols = 4;
    for (const repeats of [1, 3]) {
      for (const n of [3, 5, 7, 11]) {
        // Every third piece is a 2-row "tall" cell, as heroes render.
        const withSpans = items(n).map((it, i) => ({ ...it, span: i % 3 === 0 ? 2 : 1 }));
        const result = buildSpacedSequence(withSpans, { cols, repeats, minRowGap: 5 });
        // Re-simulate dense placement to confirm the bottom edge is flush.
        const spanFor = new Map(withSpans.map(it => [it.payload, it.span ?? 1]));
        const rows: boolean[][] = [];
        const ensure = (r: number) => { while (rows.length <= r) rows.push(new Array(cols).fill(false)); };
        for (const payload of result) {
          const span = spanFor.get(payload) ?? 1;
          outer: for (let r = 0; ; r++) {
            ensure(r + span - 1);
            for (let c = 0; c < cols; c++) {
              if (Array.from({ length: span }, (_, k) => rows[r + k][c]).every(v => !v)) {
                for (let k = 0; k < span; k++) rows[r + k][c] = true;
                break outer;
              }
            }
          }
        }
        const occupied = rows.filter(r => r.some(Boolean));
        for (const row of occupied) expect(row.every(Boolean)).toBe(true);
      }
    }
  });

  it("never repeats a key within a single row, even when there are far fewer keys than the gap needs", () => {
    // The real case: a city with ~10 artists on a 6-col grid. A 5-row window
    // holds 30 tiles, so full minRowGap separation is impossible and the
    // fallback path runs constantly. Same-row repeats must still never happen
    // while there are at least `cols` distinct keys to draw from.
    const cols = 6;
    for (const n of [6, 8, 10, 12]) {
      for (let attempt = 0; attempt < 25; attempt++) {
        const result = buildSpacedSequence(items(n), { cols, repeats: 3, minRowGap: 5 });
        for (let start = 0; start < result.length; start += cols) {
          const row = result.slice(start, start + cols);
          expect(new Set(row).size).toBe(row.length);
        }
      }
    }
  });

  it("keeps repeats of the same key at least minRowGap rows apart when there's enough variety", () => {
    const cols = 4;
    const minRowGap = 5;
    const result = buildSpacedSequence(items(20), { cols, repeats: 3, minRowGap });

    const lastRow = new Map<string, number>();
    for (let i = 0; i < result.length; i++) {
      const row = Math.floor(i / cols);
      const key = result[i];
      const last = lastRow.get(key);
      if (last !== undefined) {
        expect(row - last).toBeGreaterThanOrEqual(minRowGap);
      }
      lastRow.set(key, row);
    }
  });
});
