import { describe, it, expect } from "vitest";
import { normalizeMediumTags } from "../claude";

describe("normalizeMediumTags", () => {
  it("returns null/undefined as empty", () => {
    expect(normalizeMediumTags(null)).toEqual([]);
    expect(normalizeMediumTags(undefined)).toEqual([]);
  });

  it("keeps exact MEDIUM_OPTIONS matches", () => {
    expect(normalizeMediumTags(["Painting", "Illustration"])).toEqual(["Painting", "Illustration"]);
  });

  it("maps case-insensitive matches back to the canonical option", () => {
    expect(normalizeMediumTags(["illustration", "PAINTING"])).toEqual(["Illustration", "Painting"]);
  });

  it("trims whitespace before matching", () => {
    expect(normalizeMediumTags([" Sculpture "])).toEqual(["Sculpture"]);
  });

  it("drops values with no matching option", () => {
    expect(normalizeMediumTags(["Painting", "Not A Real Medium"])).toEqual(["Painting"]);
  });

  it("de-duplicates repeated matches", () => {
    expect(normalizeMediumTags(["Painting", "painting", "PAINTING"])).toEqual(["Painting"]);
  });
});
