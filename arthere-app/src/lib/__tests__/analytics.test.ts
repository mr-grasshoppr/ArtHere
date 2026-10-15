import { describe, it, expect } from "vitest";
import { classifyHref, classifyPath, isBotUserAgent, isUntrackedPath } from "../analytics";
import { trackEventSchema } from "../schemas";

const ORIGIN = "https://artishere.org";

describe("classifyPath", () => {
  it("counts an artist's profile the same however it was reached", () => {
    expect(classifyPath("/artists/kurtis-piltz")).toEqual({ kind: "artist", targetId: "kurtis-piltz" });
    expect(classifyPath("/cities/portland/artists/kurtis-piltz")).toEqual({ kind: "artist", targetId: "kurtis-piltz" });
  });

  it("classifies places, cities and city sections", () => {
    expect(classifyPath("/places/ampersand")).toEqual({ kind: "place", targetId: "ampersand" });
    expect(classifyPath("/cities/portland/places/ampersand")).toEqual({ kind: "place", targetId: "ampersand" });
    expect(classifyPath("/cities/portland")).toEqual({ kind: "city", targetId: "portland" });
    expect(classifyPath("/cities/portland/map")).toEqual({ kind: "section", targetId: "portland/map" });
    // The directory itself is a section, not an artist called "artists".
    expect(classifyPath("/cities/portland/artists")).toEqual({ kind: "section", targetId: "portland/artists" });
  });

  it("falls back to the path, and ignores query and fragment", () => {
    expect(classifyPath("/")).toEqual({ kind: "page", targetId: "/" });
    expect(classifyPath("/faq?x=1#top")).toEqual({ kind: "page", targetId: "/faq" });
  });
});

describe("classifyHref", () => {
  it("classifies same-site links by path", () => {
    expect(classifyHref("/artists/a-b", ORIGIN)).toEqual({ kind: "artist", targetId: "a-b" });
    expect(classifyHref(`${ORIGIN}/places/x`, ORIGIN)).toEqual({ kind: "place", targetId: "x" });
  });

  it("recognises the map view switch", () => {
    expect(classifyHref("/cities/portland/map?view=network", ORIGIN)).toEqual({ kind: "map_view", targetId: "network" });
  });

  it("records outbound links by host and path only, never query or fragment", () => {
    expect(classifyHref("https://www.instagram.com/someone/?igsh=secret#x", ORIGIN)).toEqual({
      kind: "outbound",
      targetId: "instagram.com/someone",
    });
  });

  it("never stores an email address or phone number", () => {
    expect(classifyHref("mailto:person@example.com", ORIGIN)).toEqual({ kind: "contact", targetId: "mailto" });
    expect(classifyHref("tel:+15035550100", ORIGIN)).toEqual({ kind: "contact", targetId: "tel" });
  });

  it("ignores non-navigation links", () => {
    expect(classifyHref("javascript:void(0)", ORIGIN)).toBeNull();
  });
});

describe("isUntrackedPath", () => {
  it("skips the admin area and the opt-out page only", () => {
    expect(isUntrackedPath("/admin")).toBe(true);
    expect(isUntrackedPath("/admin/artists")).toBe(true);
    expect(isUntrackedPath("/notrack")).toBe(true);
    expect(isUntrackedPath("/administrators")).toBe(false);
    expect(isUntrackedPath("/artists/x")).toBe(false);
  });
});

describe("isBotUserAgent", () => {
  it("flags crawlers and empty user agents", () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBotUserAgent("curl/8.4.0")).toBe(true);
  });

  it("lets real browsers through", () => {
    expect(
      isBotUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15")
    ).toBe(false);
    expect(
      isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148")
    ).toBe(false);
  });
});

describe("trackEventSchema", () => {
  const ok = { type: "click", kind: "artist", targetId: "a-b", path: "/cities/portland" };

  it("accepts a well-formed event", () => {
    expect(trackEventSchema.safeParse(ok).success).toBe(true);
    expect(trackEventSchema.safeParse({ ...ok, type: "search", kind: "filter", meta: { filters: { medium: ["Painting"] }, results: 3 } }).success).toBe(true);
  });

  it("rejects unknown types, odd kinds, and off-site paths", () => {
    expect(trackEventSchema.safeParse({ ...ok, type: "purchase" }).success).toBe(false);
    expect(trackEventSchema.safeParse({ ...ok, kind: "Artist<script>" }).success).toBe(false);
    expect(trackEventSchema.safeParse({ ...ok, path: "https://evil.example" }).success).toBe(false);
    expect(trackEventSchema.safeParse({ ...ok, targetId: "x".repeat(301) }).success).toBe(false);
  });
});
