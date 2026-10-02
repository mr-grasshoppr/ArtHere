/**
 * What a profile shows, and what it keeps back.
 *
 * Uploads are never refused, so an artist can hold more pieces than a
 * profile has room for. Which four are public was worked out separately in
 * three places — the profile page, the admin editor and the city grid — and
 * the grid's version disagreed: it drew on everything, so a visitor could
 * click a tile and land on a page without that piece on it.
 */
import { describe, it, expect } from "vitest";
import {
  visibleArtworkImages,
  hiddenArtworkImages,
  galleryImagesOf,
  heroImageOf,
  gallerySlotOf,
} from "../artist-images";
import { MAX_ARTWORK_IMAGES } from "../artist-options";

const img = (id: string, sortOrder: number, isHero = false) => ({ id, sortOrder, isHero });

describe("artist images — what a profile shows", () => {
  it("shows the header and the first three gallery pieces", () => {
    const images = [img("a", 3), img("hero", 7, true), img("b", 1), img("c", 5), img("d", 9)];
    expect(visibleArtworkImages(images).map(i => i.id)).toEqual(["hero", "b", "a", "c"]);
    expect(visibleArtworkImages(images).length).toBe(MAX_ARTWORK_IMAGES);
    expect(hiddenArtworkImages(images).map(i => i.id)).toEqual(["d"]);
  });

  it("keeps everything past the fourth piece, rather than losing it", () => {
    const images = [img("hero", 0, true), ...Array.from({ length: 9 }, (_, i) => img(`p${i}`, i + 1))];
    expect(visibleArtworkImages(images).length).toBe(MAX_ARTWORK_IMAGES);
    expect(hiddenArtworkImages(images).length).toBe(images.length - MAX_ARTWORK_IMAGES);
    // Every piece is accounted for, once.
    const all = [...visibleArtworkImages(images), ...hiddenArtworkImages(images)].map(i => i.id);
    expect(new Set(all).size).toBe(images.length);
  });

  it("copes with a profile that has no header set", () => {
    const images = [img("a", 2), img("b", 0), img("c", 1)];
    expect(heroImageOf(images)).toBeNull();
    expect(visibleArtworkImages(images).map(i => i.id)).toEqual(["b", "c", "a"]);
    expect(hiddenArtworkImages(images)).toEqual([]);
  });

  it("reports a piece's gallery slot, and nothing for one that is kept back", () => {
    const images = [img("hero", 0, true), img("a", 1), img("b", 2), img("c", 3), img("d", 4)];
    expect(gallerySlotOf(images, "a")).toBe(1);
    expect(gallerySlotOf(images, "c")).toBe(3);
    expect(gallerySlotOf(images, "d")).toBeNull();
    expect(gallerySlotOf(images, "hero")).toBeNull();
  });
});
