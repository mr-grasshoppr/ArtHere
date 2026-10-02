import type { CSSProperties } from "react";

// Pure, dependency-free — safe to import from client components. Server-only
// DB access (computing/fetching focals) lives in lib/image-focus.ts, which
// re-exports these for existing server-side callers.

export type Focal = { x: number; y: number; scale: number };

/**
 * Where an image sits in its box when no framing has been stored for it.
 *
 * One value, shared by every surface: the profile's gallery tiles and the
 * city artwork grid render the same pieces in the same square shape, and
 * they used to disagree here — the grid biased upwards (50% 35%) while the
 * profile centred. A stored focal was honoured by both, but around nine in
 * ten images have none, so most tiles were framed one way on the grid and
 * another on the page it links to.
 */
export const DEFAULT_OBJECT_POSITION = "50% 50%";

/**
 * What the city grid used before that rule, and still uses for the pieces
 * that were already on it.
 *
 * Switching every unframed tile at once would re-crop most of the grid in
 * one go — around nine in ten pieces have no stored framing — on artwork
 * that currently looks the way the people who uploaded it expect. So the
 * shared default applies to pieces uploaded from `SHARED_FRAMING_FROM`
 * onwards, and anything older keeps the framing it has today. Adjusting a
 * piece's framing stores a focal, which both surfaces honour, so an older
 * piece joins the rule the moment anyone touches it.
 */
export const LEGACY_GRID_OBJECT_POSITION = "50% 35%";

/** Uploads from this date frame the same way on the grid and the profile. */
export const SHARED_FRAMING_FROM = new Date("2026-09-30T00:00:00Z");

/** The grid's fallback for a piece with no stored framing. */
export function gridFallbackFor(uploadedAt: Date | string | null | undefined): string {
  if (!uploadedAt) return LEGACY_GRID_OBJECT_POSITION;
  const at = typeof uploadedAt === "string" ? new Date(uploadedAt) : uploadedAt;
  return at >= SHARED_FRAMING_FROM ? DEFAULT_OBJECT_POSITION : LEGACY_GRID_OBJECT_POSITION;
}

// The CSS for a focal point: object-position places the point within the
// cover-fit box; when scale > 1, a matching transform-origin zooms in on that
// exact point without shifting the framing. scale === 1 is identical to plain
// object-position (so untouched images render exactly as before this existed).
export function focalStyle(
  focal: Focal | undefined | null,
  fallback: string = DEFAULT_OBJECT_POSITION
): CSSProperties {
  if (!focal) return { objectPosition: fallback };
  const position = `${focal.x}% ${focal.y}%`;
  return focal.scale > 1
    ? { objectPosition: position, transform: `scale(${focal.scale})`, transformOrigin: position }
    : { objectPosition: position };
}
