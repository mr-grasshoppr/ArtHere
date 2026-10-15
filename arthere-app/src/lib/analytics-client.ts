// Browser side of the first-party analytics. `track()` is safe to call from
// anywhere in client code: it silently does nothing on localhost, Vercel
// previews, admin pages, and in any browser that has opted out at /notrack.

import { classifyHref, isUntrackedPath, type EventType } from "./analytics";

export const NOTRACK_KEY = "arthere-notrack";

export interface TrackInput {
  type: EventType;
  kind: string;
  targetId?: string | null;
  /** Previous page (pageviews only). */
  source?: string | null;
  meta?: Record<string, unknown> | null;
}

function optedOut(): boolean {
  try {
    return window.localStorage.getItem(NOTRACK_KEY) === "1";
  } catch {
    return false;
  }
}

function siteIsLive(): boolean {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    // Escape hatch for testing the tracker itself against a dev server.
    return process.env.NEXT_PUBLIC_ANALYTICS_FORCE === "1";
  }
  return !host.endsWith(".vercel.app");
}

export function trackingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (isUntrackedPath(window.location.pathname)) return false;
  return siteIsLive() && !optedOut();
}

export function track(input: TrackInput): void {
  if (!trackingEnabled()) return;
  const body = JSON.stringify({
    type: input.type,
    kind: input.kind,
    targetId: input.targetId ?? undefined,
    path: window.location.pathname,
    source: input.source ?? undefined,
    meta: input.meta ?? undefined,
  });
  try {
    // sendBeacon survives the page navigating away, which most clicks do.
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch {
    // Analytics must never break the page.
  }
}

/**
 * Record a click that navigates from code (not an <a>), so the tracker's
 * delegated listener can't see it — classifies where it goes the same way a
 * real link would, and notes which control sent it.
 */
export function trackNavigation(href: string, via: string): void {
  if (typeof window === "undefined") return;
  const dest = classifyHref(href, window.location.origin);
  if (dest) track({ type: "click", kind: dest.kind, targetId: dest.targetId, meta: { via } });
}
