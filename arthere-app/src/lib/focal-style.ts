import type { CSSProperties } from "react";

// Pure, dependency-free — safe to import from client components. Server-only
// DB access (computing/fetching focals) lives in lib/image-focus.ts, which
// re-exports these for existing server-side callers.

export type Focal = { x: number; y: number; scale: number };

// The CSS for a focal point: object-position places the point within the
// cover-fit box; when scale > 1, a matching transform-origin zooms in on that
// exact point without shifting the framing. scale === 1 is identical to plain
// object-position (so untouched images render exactly as before this existed).
export function focalStyle(focal: Focal | undefined | null, fallback = "50% 50%"): CSSProperties {
  if (!focal) return { objectPosition: fallback };
  const position = `${focal.x}% ${focal.y}%`;
  return focal.scale > 1
    ? { objectPosition: position, transform: `scale(${focal.scale})`, transformOrigin: position }
    : { objectPosition: position };
}
