import { describe, it, expect } from 'vitest';
import { coverWindow, heroTileWindow, HERO_HEADER_ASPECT } from '../hero-band';

describe('coverWindow', () => {
  it('shows the whole height of a wide image in a box of the same shape', () => {
    const w = coverWindow({ x: 50, y: 50, scale: 1 }, 2, 2);
    expect(w).toEqual({ left: 0, top: 0, width: 1, height: 1 });
  });

  it('shows a horizontal band of a tall image in a wide box, placed by the focal point', () => {
    // A square image in a 21:9 box shows 9/21 of its height.
    const top = coverWindow({ x: 50, y: 0, scale: 1 }, 1, HERO_HEADER_ASPECT);
    expect(top.height).toBeCloseTo(9 / 21, 9);
    expect(top.top).toBeCloseTo(0, 9);
    const bottom = coverWindow({ x: 50, y: 100, scale: 1 }, 1, HERO_HEADER_ASPECT);
    expect(bottom.top + bottom.height).toBeCloseTo(1, 9);
  });

  it('zooms in around the focal point', () => {
    const w = coverWindow({ x: 50, y: 50, scale: 2 }, 1, 1);
    expect(w).toEqual({ left: 0.25, top: 0.25, width: 0.5, height: 0.5 });
  });
});

describe('heroTileWindow (GRID-11)', () => {
  // Egor Shokoladov's hero: a near-square print framed low and zoomed for the header.
  const focal = { x: 25.96, y: 78.7, scale: 1.25 };
  const imageAspect = 1.05;

  it("takes its top and bottom from the header's framing, whatever the tile's shape", () => {
    const header = coverWindow(focal, imageAspect, HERO_HEADER_ASPECT);
    for (const tileAspect of [1, 0.5, 4 / 3]) {
      const tile = heroTileWindow(focal, imageAspect, tileAspect);
      expect(tile.top, `tile ${tileAspect}`).toBeCloseTo(header.top, 9);
      expect(tile.height, `tile ${tileAspect}`).toBeCloseTo(header.height, 9);
    }
  });

  it("is centred across on the header's centre, inside the header's own width", () => {
    const header = coverWindow(focal, imageAspect, HERO_HEADER_ASPECT);
    const tile = heroTileWindow(focal, imageAspect, 1);
    expect(tile.left + tile.width / 2).toBeCloseTo(header.left + header.width / 2, 9);
    expect(tile.left).toBeGreaterThanOrEqual(header.left - 1e-9);
    expect(tile.left + tile.width).toBeLessThanOrEqual(header.left + header.width + 1e-9);
  });

  it('never shows past the edge of the image', () => {
    for (const ia of [0.4, 0.8, 1, 1.5, 3]) {
      for (const ta of [0.5, 1, 2]) {
        for (const f of [{ x: 0, y: 0, scale: 1 }, { x: 100, y: 100, scale: 2.5 }, { x: 30, y: 70, scale: 1.3 }]) {
          const w = heroTileWindow(f, ia, ta);
          expect(w.left).toBeGreaterThanOrEqual(-1e-9);
          expect(w.top).toBeGreaterThanOrEqual(-1e-9);
          expect(w.left + w.width).toBeLessThanOrEqual(1 + 1e-9);
          expect(w.top + w.height).toBeLessThanOrEqual(1 + 1e-9);
          // And never distorts: the window has the tile's shape.
          expect((w.width * ia) / w.height).toBeCloseTo(ta, 6);
        }
      }
    }
  });

  it("trims the band evenly when a narrow image can't show all of it at this tile shape", () => {
    // A tall, narrow image in a tile wider than its header band allows (3:1).
    const w = heroTileWindow({ x: 50, y: 50, scale: 1 }, 0.5, 3);
    expect(w.width).toBeCloseTo(1, 9);
    const header = coverWindow({ x: 50, y: 50, scale: 1 }, 0.5, HERO_HEADER_ASPECT);
    expect(w.top + w.height / 2).toBeCloseTo(header.top + header.height / 2, 9);
  });

  it('frames an unframed hero the way the header does — centred', () => {
    const w = heroTileWindow(null, 1, 1);
    expect(w.top + w.height / 2).toBeCloseTo(0.5, 9);
    expect(w.height).toBeCloseTo(9 / 21, 9);
  });
});
