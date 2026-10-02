import type { Focal } from './focal-style';

// Frames an artist's hero image in a grid tile by its header framing (GRID-11).
//
// A hero is framed for the profile header — a wide 21:9 strip — and its
// focal point and zoom are tuned for that strip. Reused as-is in a squarer
// tile, the same focal shows far more above and below than the header does:
// the paper margin, the wall, the mat. So for a hero, the tile takes its top
// and bottom from the header: it shows exactly the vertical band the header
// shows, centred across on the header's own centre.
//
// Pure geometry, no DOM. Positions and sizes are fractions of the image (0–1).

/** The header's shape, as previewed in the admin framing editor. */
export const HERO_HEADER_ASPECT = 21 / 9;

export interface ImageWindow {
  left: number;
  top: number;
  width: number;
  height: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * The part of the image an `object-cover` box of `boxAspect` (width/height)
 * shows, given a focal point (percent) and zoom — exactly what focalStyle()
 * renders: object-position at the focal point, then a scale about that point.
 */
export function coverWindow(focal: Focal, imageAspect: number, boxAspect: number): ImageWindow {
  const px = focal.x / 100;
  const py = focal.y / 100;
  const s = Math.max(1, focal.scale);
  // Unzoomed cover: the image fills the box along one axis and overflows the other.
  const visW = Math.min(1, boxAspect / imageAspect);
  const visH = Math.min(1, imageAspect / boxAspect);
  // The image point sitting under the focal point of the box…
  const ux = px * (1 - visW) + px * visW;
  const uy = py * (1 - visH) + py * visH;
  // …stays put while the zoom shrinks the window around it.
  const width = visW / s;
  const height = visH / s;
  return { left: ux - px * width, top: uy - py * height, width, height };
}

/**
 * The window a tile of `tileAspect` shows for a hero: the header's vertical
 * band, full height, centred across on the header's centre. If the image is
 * too narrow to show that band at this tile shape, the band is trimmed evenly
 * top and bottom (around its middle) until the tile fits the image's width.
 */
export function heroTileWindow(
  focal: Focal | null,
  imageAspect: number,
  tileAspect: number,
  headerAspect = HERO_HEADER_ASPECT
): ImageWindow {
  // No stored framing: the header centres the image (DEFAULT_OBJECT_POSITION).
  const header = coverWindow(focal ?? { x: 50, y: 50, scale: 1 }, imageAspect, headerAspect);
  let height = header.height;
  let width = (tileAspect * height) / imageAspect;
  let top = header.top;
  if (width > 1) {
    const fitted = imageAspect / tileAspect;
    top = header.top + (height - fitted) / 2;
    height = fitted;
    width = 1;
  }
  const centreX = header.left + header.width / 2;
  const left = clamp(centreX - width / 2, 0, 1 - width);
  return { left, top: clamp(top, 0, 1 - height), width, height };
}
