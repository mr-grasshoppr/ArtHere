import { describe, it, expect } from "vitest";
import { metroHubSlug } from "../city-metro";

describe("metroHubSlug", () => {
  it("maps Portland and its suburbs to the Portland hub", () => {
    expect(metroHubSlug("97219")).toBe("portland"); // Multnomah Village
    expect(metroHubSlug("97124")).toBe("portland"); // Hillsboro
    expect(metroHubSlug("97005")).toBe("portland"); // Beaverton
    expect(metroHubSlug("97045")).toBe("portland"); // Oregon City
    expect(metroHubSlug("98661")).toBe("portland"); // Vancouver, WA
  });
  it("leaves other zips unassigned", () => {
    expect(metroHubSlug("97401")).toBeNull(); // Eugene
    expect(metroHubSlug("60614")).toBeNull();
    expect(metroHubSlug("")).toBeNull();
    expect(metroHubSlug(null)).toBeNull();
  });
});
