import { prisma } from "@/lib/db";
import { detectFocalPoint } from "@/lib/claude";
import type { CSSProperties } from "react";

export type Focal = { x: number; y: number; scale: number };

// Compute an image's focal point via the vision model and store it, keyed by
// URL. Best-effort — a failure is logged and swallowed so it never breaks the
// upload it's attached to. Skips URLs we've already analyzed (including ones a
// human has manually framed — auto-detection never overwrites a manual edit).
export async function computeAndStoreFocus(url: string): Promise<void> {
  try {
    const existing = await prisma.imageFocus.findUnique({ where: { url }, select: { url: true } });
    if (existing) return;
    const focal = await detectFocalPoint(url);
    if (!focal) return;
    await prisma.imageFocus.upsert({
      where: { url },
      create: { url, x: focal.x, y: focal.y },
      update: { x: focal.x, y: focal.y },
    });
  } catch (err) {
    console.error("[focal] computeAndStoreFocus failed for", url, err);
  }
}

// Batch-fetch stored focal points for a set of URLs. Returns a url→Focal map;
// URLs without a stored focus are simply absent (caller falls back to center).
export async function getFocals(urls: (string | null | undefined)[]): Promise<Map<string, Focal>> {
  const clean = [...new Set(urls.filter((u): u is string => !!u))];
  if (clean.length === 0) return new Map();
  const rows = await prisma.imageFocus.findMany({
    where: { url: { in: clean } },
    select: { url: true, x: true, y: true, scale: true },
  });
  return new Map(rows.map((r) => [r.url, { x: r.x, y: r.y, scale: r.scale }]));
}

// The CSS for a focal point: object-position places the point within the
// cover-fit box; when scale > 1, a matching transform-origin zooms in on that
// exact point without shifting the framing. scale === 1 is identical to plain
// object-position (so untouched images render exactly as before this existed).
export function focalStyle(focal: Focal | undefined, fallback = "50% 50%"): CSSProperties {
  if (!focal) return { objectPosition: fallback };
  const position = `${focal.x}% ${focal.y}%`;
  return focal.scale > 1
    ? { objectPosition: position, transform: `scale(${focal.scale})`, transformOrigin: position }
    : { objectPosition: position };
}

// Convenience: fetch focals for a set of URLs and return a url→style map ready
// to spread onto an <img>/<Image>'s style prop. URLs without a stored focus are
// absent (the component falls back to center).
export async function getFocalStyles(
  urls: (string | null | undefined)[],
): Promise<Map<string, CSSProperties>> {
  const focals = await getFocals(urls);
  return new Map([...focals].map(([url, f]) => [url, focalStyle(f)]));
}
