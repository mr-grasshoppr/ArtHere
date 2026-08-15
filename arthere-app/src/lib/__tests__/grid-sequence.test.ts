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
