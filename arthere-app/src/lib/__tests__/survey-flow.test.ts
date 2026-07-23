import { describe, it, expect } from "vitest";
import { getNextStep, getFullPath, isMakingArt } from "../survey-flow";
import { NOT_MAKING_ART } from "../survey-constants";

const artist = { artistStatus: "Yes, it is my primary occupation" };
const nonArtist = { artistStatus: NOT_MAKING_ART };

describe("survey step machine", () => {
  it("branches artists into the art-medium and practice steps", () => {
    expect(getNextStep("about-you-art", artist)).toBe("art-medium");
    expect(getNextStep("portland-detail", artist)).toBe("career-stage");
  });

  it("routes non-artists around the artist-only steps", () => {
    expect(getNextStep("about-you-art", nonArtist)).toBe("portland-familiarity");
    expect(getNextStep("portland-detail", nonArtist)).toBe("involvement");
  });

  it("full artist path visits every artist step exactly once and ends at done", () => {
    const path = getFullPath(artist);
    expect(path[0]).toBe("location");
    expect(path[path.length - 1]).toBe("done");
    expect(path).toContain("career-stage");
    expect(path).toContain("practice-goals");
    expect(new Set(path).size).toBe(path.length); // no loops
  });

  it("full non-artist path skips artist steps", () => {
    const path = getFullPath(nonArtist);
    expect(path).not.toContain("art-medium");
    expect(path).not.toContain("career-stage");
    expect(path).not.toContain("practice");
    expect(path[path.length - 1]).toBe("done");
  });

  it("empty status is treated as not-yet-answered, not artist", () => {
    expect(isMakingArt({ artistStatus: "" })).toBe(false);
  });
});
