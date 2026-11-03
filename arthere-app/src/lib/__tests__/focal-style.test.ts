import { describe, it, expect } from "vitest";
import { focalStyle } from "@/lib/focal-style";

describe("focalStyle zoom", () => {
  it("leaves scale 1 as plain object-position", () => {
    expect(focalStyle({ x: 40, y: 60, scale: 1 })).toEqual({ objectPosition: "40% 60%" });
  });
  it("zooms in about the focal point above 1", () => {
    expect(focalStyle({ x: 40, y: 60, scale: 2 })).toMatchObject({ transform: "scale(2)", transformOrigin: "40% 60%" });
  });
  it("fits the whole photo and shrinks it below 1", () => {
    expect(focalStyle({ x: 50, y: 50, scale: 0.7 })).toEqual({
      objectFit: "contain",
      objectPosition: "50% 50%",
      transform: "scale(0.7)",
      transformOrigin: "50% 50%",
    });
  });
});
