import { prisma } from "@/lib/db";
import { detectFocalPoint } from "@/lib/claude";

export type Focal = { x: number; y: number };

// Compute an image's focal point via the vision model and store it, keyed by
// URL. Best-effort — a failure is logged and swallowed so it never breaks the
// upload it's attached to. Skips URLs we've already analyzed.
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
    select: { url: true, x: true, y: true },
  });
  return new Map(rows.map((r) => [r.url, { x: r.x, y: r.y }]));
}

// CSS object-position string for a focal point, or a fallback when none exists.
export function objectPosition(focal: Focal | undefined, fallback = "50% 50%"): string {
  return focal ? `${focal.x}% ${focal.y}%` : fallback;
}

// Convenience: fetch focals for a set of URLs and return a url→object-position
// string map, ready to hand to a display component. URLs without a stored
// focus are absent (the component falls back to center).
export async function getFocalPositions(
  urls: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const focals = await getFocals(urls);
  return new Map([...focals].map(([url, f]) => [url, objectPosition(f)]));
}
