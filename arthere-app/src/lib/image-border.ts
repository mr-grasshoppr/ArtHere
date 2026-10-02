import sharp from "sharp";
import type { Focal } from "@/lib/focal-style";

// Detects a plain white (or near-white) border baked into an image — a
// photographed print on a white mat, a scan with paper margins, an artist's
// export with a white frame — and turns it into a focal point + zoom that
// crops the border away wherever the image is rendered with object-cover.
//
// Artwork grids look wrong when a tile shows the mat as well as the piece: the
// art floats off-centre inside a white box (see REQUIRED-DESIGN-FEATURES.md,
// "Crop white borders out of artwork tiles"). Trimming happens here, at focal
// detection time, rather than by rewriting the stored file, so the artist's
// original stays intact and the profile lightbox can still show the full mat.

// A pixel counts as "white" when all three channels are this bright...
const WHITE_MIN = 225;
// ...and within this spread of each other (tolerates warm/cool paper, rejects
// pale colours that are part of the picture).
const WHITE_SPREAD = 22;
// A row/column is border when at least this fraction of its pixels are white —
// leaves room for scanner dust, a dark corner shadow, or an edge signature.
const ROW_WHITE_FRACTION = 0.985;
// Ignore borders thinner than this (per side, as a fraction of the dimension):
// anti-aliased edges and thin keylines aren't worth a re-frame.
const MIN_MARGIN = 0.015;
// Never zoom past this — a tiny sketch on a huge sheet would otherwise blow
// up into a blurry tile. The mat stays visible in that case, which is the
// lesser evil.
const MAX_SCALE = 2.5;
// Analyse a downscaled copy; the border only needs to be located to ~0.5%.
const ANALYSIS_WIDTH = 400;

export type ContentBox = { left: number; top: number; right: number; bottom: number };

// Returns the bounding box of the non-white content as fractions of the
// image's width and height (top-left origin), or null when there is no
// meaningful border on any side.
export async function detectWhiteBorder(source: Buffer | string): Promise<ContentBox | null> {
  const { data, info } = await sharp(source)
    .rotate() // honour EXIF orientation so fractions match what browsers show
    .resize({ width: ANALYSIS_WIDTH, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const isWhite = (x: number, y: number) => {
    const i = (y * width + x) * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
    return lo >= WHITE_MIN && hi - lo <= WHITE_SPREAD;
  };
  const rowIsWhite = (y: number) => {
    let n = 0;
    for (let x = 0; x < width; x++) if (isWhite(x, y)) n++;
    return n / width >= ROW_WHITE_FRACTION;
  };
  const colIsWhite = (x: number) => {
    let n = 0;
    for (let y = 0; y < height; y++) if (isWhite(x, y)) n++;
    return n / height >= ROW_WHITE_FRACTION;
  };

  let top = 0;
  while (top < height && rowIsWhite(top)) top++;
  if (top === height) return null; // blank image — leave it alone
  let bottom = height;
  while (bottom > top && rowIsWhite(bottom - 1)) bottom--;
  let left = 0;
  while (left < width && colIsWhite(left)) left++;
  let right = width;
  while (right > left && colIsWhite(right - 1)) right--;

  const box = { left: left / width, top: top / height, right: right / width, bottom: bottom / height };
  const margins = [box.left, box.top, 1 - box.right, 1 - box.bottom];
  if (!margins.some((m) => m >= MIN_MARGIN)) return null;
  return box;
}

// Converts a content box into the focal point + scale that object-cover needs
// to keep the visible window inside the content for ANY tile aspect ratio.
//
// object-position `p%` distributes the overflow p% to the left/top and
// (100-p)% to the right/bottom. So placing p at (left margin / total margin)
// makes the window slide exactly along the content as it grows, and a zoom of
// 1/min(contentW, contentH) guarantees the window never grows past the
// content in either axis. A side with no margin has no preference, and falls
// back to the vision focal (or centre) for that axis.
export function focalFromContentBox(box: ContentBox, fallback: { x: number; y: number } = { x: 50, y: 50 }): Focal {
  const contentW = box.right - box.left;
  const contentH = box.bottom - box.top;
  const marginW = 1 - contentW;
  const marginH = 1 - contentH;
  const x = marginW > 0 ? (box.left / marginW) * 100 : fallback.x;
  const y = marginH > 0 ? (box.top / marginH) * 100 : fallback.y;
  const scale = Math.min(MAX_SCALE, 1 / Math.min(contentW, contentH));
  const round = (n: number) => Math.round(n * 100) / 100;
  // Scale rounds UP: rounding down by even 0.005 lets a sliver of mat back in.
  return { x: round(x), y: round(y), scale: Math.ceil(scale * 100) / 100 };
}

// Fetches a remote image and returns a border-trimming focal, or null when the
// image has no white border to trim.
export async function detectBorderFocal(url: string, fallback?: { x: number; y: number }): Promise<Focal | null> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const box = await detectWhiteBorder(buf);
  return box ? focalFromContentBox(box, fallback) : null;
}
