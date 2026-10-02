import { describe, it, expect } from 'vitest';
import { layoutCallouts, type ScreenPoint } from '../pin-callouts';

const MIN = 12;

const closestPair = (pts: ScreenPoint[]) => {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
  return min;
};
const away = (a: ScreenPoint, b: ScreenPoint) => Math.hypot(a.x - b.x, a.y - b.y);

describe('layoutCallouts', () => {
  it('leaves pins with room exactly on their spot, with no leader lines', () => {
    const pts = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 0, y: 50 }];
    const { positions, anchors } = layoutCallouts(pts, MIN);
    expect(positions).toEqual(pts);
    expect(anchors).toEqual([null, null, null]);
  });

  it('nudges overlapping pins just clear of each other, each with a leader line from its real spot', () => {
    const pts = [{ x: 100, y: 100 }, { x: 103, y: 101 }, { x: 101, y: 104 }];
    const { positions, anchors } = layoutCallouts(pts, MIN);
    expect(closestPair(positions)).toBeGreaterThanOrEqual(MIN - 1e-9);
    pts.forEach((p, i) => {
      expect(anchors[i]).toEqual(p);
      // Lines stay short: no pin ends up more than a pin's width from its spot.
      expect(away(positions[i], p)).toBeLessThan(MIN);
    });
  });

  it('keeps the real arrangement: every pair keeps its real direction', () => {
    // An L of three shops: one at the corner, one a little east, one north.
    const pts = [{ x: 100, y: 100 }, { x: 104, y: 100 }, { x: 100, y: 92 }];
    const { positions: out } = layoutCallouts(pts, MIN);
    expect(out[1].x).toBeGreaterThan(out[0].x); // east is still east of the corner
    expect(out[2].y).toBeLessThan(out[0].y); // north is still north of it
    expect(out[2].y).toBeLessThan(out[1].y); // and north of the east one
    expect(closestPair(out)).toBeGreaterThanOrEqual(MIN - 1e-9);
  });

  it("doesn't fling a pin that barely overlaps just because two others are on top of each other", () => {
    // Two shops in one building, and a third that only just touches them.
    const pts = [{ x: 100, y: 100 }, { x: 100.5, y: 100 }, { x: 111, y: 100 }];
    const { positions } = layoutCallouts(pts, MIN);
    expect(away(positions[2], pts[2])).toBeLessThan(8);
  });

  it('pushes a pair apart only as much as needed', () => {
    const { positions } = layoutCallouts([{ x: 0, y: 0 }, { x: 6, y: 0 }], MIN);
    // Within a hair: the pair is pushed a fraction of a pixel extra so it
    // actually clears rather than creeping up on the minimum forever.
    expect(away(positions[0], positions[1])).toBeCloseTo(MIN, 1);
  });

  it('sets pins at the very same spot apart, either side of it', () => {
    const pts = [{ x: 10, y: 10 }, { x: 10, y: 10 }];
    const { positions } = layoutCallouts(pts, MIN);
    expect(closestPair(positions)).toBeGreaterThanOrEqual(MIN - 1e-9);
    for (const p of positions) expect(away(p, pts[0])).toBeLessThan(MIN);
  });

  it('stays compact however far out you zoom — not a sprawl', () => {
    // Zoomed all the way out, every pin projects to (nearly) the same pixel.
    const pts = Array.from({ length: 9 }, (_, i) => ({ x: 300 + (i % 3) * 0.1, y: 300 + Math.floor(i / 3) * 0.1 }));
    const { positions } = layoutCallouts(pts, MIN);
    expect(closestPair(positions)).toBeGreaterThanOrEqual(MIN - 1e-9);
    for (const p of positions) expect(away(p, { x: 300, y: 300 })).toBeLessThan(30);
  });

  it("glides as you zoom — pins don't swap places or sprawl between steps", () => {
    // Seven places, zoomed out step by step: their spots draw in toward the
    // middle each frame, as real zooming does.
    const real = [
      { x: 0, y: 0 }, { x: 3, y: 1 }, { x: 1, y: 4 }, { x: 30, y: -20 }, { x: 34, y: -18 }, { x: 60, y: 10 }, { x: -25, y: 15 },
    ];
    let previous: ScreenPoint[] | undefined;
    for (let step = 0; step < 40; step++) {
      const scale = 0.92 ** step;
      const pts = real.map((p) => ({ x: 400 + p.x * scale * 4, y: 300 + p.y * scale * 4 }));
      const out = layoutCallouts(pts, MIN, MIN - 4, previous);
      // Never touching; and a nudged pin keeps the full spacing from everyone.
      // (Two pins on their own spots can sit inside the breathing room —
      // they aren't touching, so they're left alone.)
      expect(closestPair(out.positions), `step ${step}`).toBeGreaterThanOrEqual(MIN - 4);
      out.positions.forEach((p, i) => {
        if (!out.anchors[i]) return;
        out.positions.forEach((q, j) => {
          if (j !== i) expect(away(p, q), `step ${step}, pins ${i}/${j}`).toBeGreaterThanOrEqual(MIN - 1e-9);
        });
      });
      if (previous) {
        // Between steps, no pin jumps around its spot by more than a few
        // pixels (the spots themselves move as the zoom changes; that's fine).
        out.offsets.forEach((o, i) => expect(away(o, previous![i]), `step ${step}, pin ${i}`).toBeLessThan(6));
      }
      // And none wanders far from its real spot.
      out.positions.forEach((p, i) => expect(away(p, pts[i]), `step ${step}, pin ${i}`).toBeLessThan(30));
      previous = out.offsets;
    }
  });

  it('drops the call-out once pins stop touching, even if they sit closer than the breathing room', () => {
    // 15px apart: within the 16px spacing, but not touching at 12px.
    const pts = [{ x: 0, y: 0 }, { x: 15, y: 0 }];
    const { positions, anchors } = layoutCallouts(pts, 16, 12);
    expect(anchors).toEqual([null, null]);
    expect(positions).toEqual(pts);
    // Touching, they're nudged.
    expect(layoutCallouts([{ x: 0, y: 0 }, { x: 10, y: 0 }], 16, 12).anchors.every((a) => a !== null)).toBe(true);
  });

  it('only gives call-outs to pins that actually overlap — a neighbor with room stays put, with no line', () => {
    const pts = [{ x: 100, y: 100 }, { x: 101, y: 100 }, { x: 100, y: 80 }];
    const { positions, anchors } = layoutCallouts(pts, MIN);
    expect(anchors[0]).not.toBeNull();
    expect(anchors[1]).not.toBeNull();
    expect(anchors[2]).toBeNull();
    expect(positions[2]).toEqual(pts[2]);
    expect(closestPair(positions)).toBeGreaterThanOrEqual(MIN - 1e-9);
  });

  it('never overlaps — across random scatters, with and without a previous frame', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
    for (let run = 0; run < 100; run++) {
      const spread = 5 + rand() * 200;
      const pts = Array.from({ length: 3 + Math.floor(rand() * 12) }, () => ({ x: rand() * spread, y: rand() * spread }));
      const first = layoutCallouts(pts, MIN);
      const second = layoutCallouts(pts, MIN, MIN, first.offsets);
      for (const { positions, anchors } of [first, second]) {
        expect(closestPair(positions)).toBeGreaterThanOrEqual(MIN - 1e-9);
        pts.forEach((p, i) => {
          if (anchors[i] === null) expect(positions[i]).toEqual(p);
        });
      }
    }
  });
});
