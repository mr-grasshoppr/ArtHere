import { describe, it, expect } from "vitest";
import { focalFromContentBox } from "@/lib/image-border";

// GRID-9: the framing derived from a white border must keep object-cover's
// visible window inside the artwork for any tile aspect ratio. This checks the
// geometry directly: with object-position p% and zoom s, the window shows
// image fractions [p(1-v), p + (1-p)v] on an axis, where v ≤ 1/s.
function windowOn(p: number, s: number, v: number) {
  const q = p / 100;
  return [q * (1 - v), q + (1 - q) * v];
}

describe("focalFromContentBox (GRID-9)", () => {
  it("centres a symmetric mat and zooms just past it", () => {
    const f = focalFromContentBox({ left: 0.1, top: 0.1, right: 0.9, bottom: 0.9 });
    expect(f).toEqual({ x: 50, y: 50, scale: 1.25 });
  });

  it("anchors to the content edge when the border is one-sided", () => {
    const f = focalFromContentBox({ left: 0, top: 0.2, right: 1, bottom: 1 }, { x: 33, y: 70 });
    expect(f.x).toBe(33); // no horizontal border → vision point steers x
    expect(f.y).toBe(100); // all overflow goes above → content top sits at the window top
    expect(f.scale).toBe(1.25);
  });

  it("keeps the window inside the content for every cell shape", () => {
    const box = { left: 0.02, top: 0.15, right: 0.95, bottom: 0.9 };
    const f = focalFromContentBox(box);
    // Visible fraction on an axis ranges from 1/scale (the axis that fits)
    // down towards 0 (a very elongated cell in the other direction).
    for (let v = 1 / f.scale; v > 0; v -= 0.05) {
      const [l, r] = windowOn(f.x, f.scale, v);
      const [t, b] = windowOn(f.y, f.scale, v);
      expect(l).toBeGreaterThanOrEqual(box.left - 1e-3);
      expect(r).toBeLessThanOrEqual(box.right + 1e-3);
      expect(t).toBeGreaterThanOrEqual(box.top - 1e-3);
      expect(b).toBeLessThanOrEqual(box.bottom + 1e-3);
    }
  });

  it("caps the zoom rather than blowing up a tiny piece", () => {
    const f = focalFromContentBox({ left: 0.4, top: 0.4, right: 0.6, bottom: 0.6 });
    expect(f.scale).toBe(2.5);
  });
});
