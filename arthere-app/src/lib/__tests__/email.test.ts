import { describe, it, expect } from "vitest";
import { escapeHtml, escapeHtmlWithBreaks, isValidEmail } from "../email";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
  });

  it("escapeHtmlWithBreaks escapes first, then converts newlines", () => {
    expect(escapeHtmlWithBreaks("<b>\nhi")).toBe("&lt;b&gt;<br>hi");
  });
});

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("artist@example.com")).toBe(true);
  });
  it("rejects junk", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("has space@example.com")).toBe(false);
  });
});
