import { NextRequest, NextResponse } from "next/server";

// Minimal per-IP fixed-window rate limiter for public endpoints (contact,
// survey, magic-link request, AI search). In-memory: each serverless
// instance keeps its own window, so this is best-effort — enough to stop
// casual abuse and runaway AI spend at current scale. If real protection is
// ever needed, swap the Map for Vercel KV / Upstash with the same interface.

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const MAX_ENTRIES = 10_000; // hard cap so the map can't grow unbounded

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

/**
 * Returns null if the request is within its limit, or a 429 response if not.
 *
 *   const limited = rateLimit(req, "contact", { limit: 5, windowSeconds: 600 });
 *   if (limited) return limited;
 */
export function rateLimit(
  req: NextRequest,
  bucket: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): NextResponse | null {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();

  const win = windows.get(key);
  if (!win || win.resetAt <= now) {
    if (windows.size >= MAX_ENTRIES) {
      // Drop expired entries; if still full, reset entirely (fail open).
      for (const [k, w] of windows) {
        if (w.resetAt <= now) windows.delete(k);
      }
      if (windows.size >= MAX_ENTRIES) windows.clear();
    }
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return null;
  }

  win.count += 1;
  if (win.count > limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((win.resetAt - now) / 1000)) } }
    );
  }
  return null;
}
