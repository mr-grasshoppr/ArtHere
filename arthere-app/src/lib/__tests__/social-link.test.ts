import { describe, it, expect } from "vitest";
import { LinkType } from "@prisma/client";
import { classifySocialLink } from "../social-link";

describe("classifySocialLink", () => {
  it("returns null for blank/absent input", () => {
    expect(classifySocialLink(null)).toBeNull();
    expect(classifySocialLink(undefined)).toBeNull();
    expect(classifySocialLink("   ")).toBeNull();
  });

  it("classifies a full instagram URL", () => {
    expect(classifySocialLink("https://instagram.com/janedoe")).toEqual({
      type: LinkType.INSTAGRAM,
      url: "https://instagram.com/janedoe",
    });
  });

  it("classifies an instagram URL with www", () => {
    expect(classifySocialLink("https://www.instagram.com/janedoe")).toEqual({
      type: LinkType.INSTAGRAM,
      url: "https://www.instagram.com/janedoe",
    });
  });

  it("classifies a facebook URL", () => {
    expect(classifySocialLink("facebook.com/janedoeart")).toEqual({
      type: LinkType.FACEBOOK,
      url: "https://facebook.com/janedoeart",
    });
  });

  it("treats a bare @handle as instagram", () => {
    expect(classifySocialLink("@jane_doe.art")).toEqual({
      type: LinkType.INSTAGRAM,
      url: "https://instagram.com/jane_doe.art",
    });
  });

  it("classifies an unrecognized domain as WEBSITE", () => {
    expect(classifySocialLink("janedoeart.com")).toEqual({
      type: LinkType.WEBSITE,
      url: "https://janedoeart.com",
    });
  });

  it("prepends https:// to a bare domain but leaves an existing scheme alone", () => {
    expect(classifySocialLink("http://janedoeart.com")).toEqual({
      type: LinkType.WEBSITE,
      url: "http://janedoeart.com",
    });
  });

  it("returns null for free text that isn't link-shaped", () => {
    expect(classifySocialLink("DM me on IG")).toBeNull();
    expect(classifySocialLink("no website yet")).toBeNull();
  });
});
