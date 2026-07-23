import { describe, it, expect } from "vitest";
import { slugify } from "../slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Kurtis Piltz")).toBe("kurtis-piltz");
  });
  it("collapses punctuation runs and trims hyphens", () => {
    expect(slugify("  Mary T. Lee!  ")).toBe("mary-t-lee");
    expect(slugify("--weird--input--")).toBe("weird-input");
  });
  it("handles unicode by stripping to ascii alphanumerics", () => {
    expect(slugify("Café Höhe")).toBe("caf-h-he");
  });
});
