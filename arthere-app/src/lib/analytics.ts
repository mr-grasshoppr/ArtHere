// Shared, dependency-free pieces of the first-party analytics: how a URL is
// turned into "what was this about" (artist, place, city, ...), what a
// well-formed event looks like, and which user agents to ignore. Used by the
// browser tracker (lib/analytics-client.ts), the /api/track route, and the
// admin Analytics page, so all three agree on the vocabulary.

export const EVENT_TYPES = ["pageview", "click", "search"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface Classified {
  kind: string;
  targetId: string | null;
}

const MAX_TARGET = 300;

function clip(s: string): string {
  return s.length > MAX_TARGET ? s.slice(0, MAX_TARGET) : s;
}

/**
 * What an on-site path is *about*. Artist and place pages are identified by
 * slug (so a profile reached from the home page, a city tab or the map all
 * count toward the same artist); everything else falls back to its path.
 */
export function classifyPath(pathname: string): Classified {
  const seg = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean);
  if (seg.length === 0) return { kind: "page", targetId: "/" };

  if (seg[0] === "artists" && seg.length === 2) return { kind: "artist", targetId: clip(seg[1]) };
  if (seg[0] === "places" && seg.length === 2) return { kind: "place", targetId: clip(seg[1]) };

  if (seg[0] === "cities" && seg.length >= 2) {
    const city = seg[1];
    if (seg.length === 2) return { kind: "city", targetId: clip(city) };
    if (seg[2] === "artists" && seg.length === 4) return { kind: "artist", targetId: clip(seg[3]) };
    if (seg[2] === "places" && seg.length === 4) return { kind: "place", targetId: clip(seg[3]) };
    if (seg.length === 3) return { kind: "section", targetId: clip(`${city}/${seg[2]}`) };
  }

  return { kind: "page", targetId: clip("/" + seg.join("/")) };
}

/**
 * What a clicked link points at. Same-site links are classified by path;
 * links off the site are recorded by host + path only (never the query or
 * fragment); mailto:/tel: are recorded as a bare "contact" with no address.
 * Returns null for things that aren't navigation (bare "#", javascript:).
 */
export function classifyHref(href: string, currentOrigin: string): Classified | null {
  let url: URL;
  try {
    url = new URL(href, currentOrigin);
  } catch {
    return null;
  }
  if (url.protocol === "mailto:" || url.protocol === "tel:") {
    return { kind: "contact", targetId: url.protocol.slice(0, -1) };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  if (url.origin !== currentOrigin) {
    return { kind: "outbound", targetId: clip(url.host.replace(/^www\./, "") + url.pathname.replace(/\/$/, "")) };
  }

  // The map tab's Geographic/Network switch is the same page with ?view=…
  if (/\/map\/?$/.test(url.pathname) && url.searchParams.has("view")) {
    return { kind: "map_view", targetId: clip(url.searchParams.get("view") ?? "") };
  }
  return classifyPath(url.pathname);
}

/** Paths the tracker never reports on: the admin area and the opt-out page. */
export function isUntrackedPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/notrack";
}

const BOT_UA =
  /bot|crawl|spider|slurp|scrape|fetch|preview|headless|lighthouse|pagespeed|monitor|uptime|curl|wget|python|node|axios|go-http|java\/|facebookexternalhit|embedly|whatsapp|telegram|discord/i;

/** Best-effort bot filter — a missing user agent counts as a bot. */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  return !ua || BOT_UA.test(ua);
}
