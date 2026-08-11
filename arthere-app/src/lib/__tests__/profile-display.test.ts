import { describe, it, expect } from "vitest";
import { hireForSentence, socialPlatformName } from "../profile-display";

describe("hireForSentence", () => {
  it("maps offerings to friendly verbs", () => {
    expect(hireForSentence("Kurtis", "Buying existing artwork, Custom work")).toBe(
      "Kurtis sells artwork, and takes commissions."
    );
  });
  it("dedupes repeated verbs", () => {
    expect(hireForSentence("Ana", "Teaching classes, lessons, or workshops")).toBe("Ana teaches.");
  });
  it("returns empty string for empty input", () => {
    expect(hireForSentence("Ana", "")).toBe("");
  });
  it("uses the first name exactly as given, even if it's two words", () => {
    expect(hireForSentence("Mary Ann", "Consultations")).toBe("Mary Ann offers consultations.");
  });
});

describe("socialPlatformName", () => {
  it("treats bare handles as Instagram", () => {
    expect(socialPlatformName("myhandle")).toBe("Instagram");
  });
  it("detects known platforms from URLs", () => {
    expect(socialPlatformName("https://www.instagram.com/x")).toBe("Instagram");
    expect(socialPlatformName("https://www.etsy.com/shop/x")).toBe("Etsy");
    expect(socialPlatformName("https://behance.net/x")).toBe("Behance");
  });
  it("falls back for unknown hosts", () => {
    expect(socialPlatformName("https://example.com/me")).toBe("Social media");
  });
});
