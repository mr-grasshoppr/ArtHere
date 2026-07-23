import { describe, it, expect } from "vitest";
import { esc, row } from "../csv";

describe("csv esc", () => {
  it("passes plain values through", () => {
    expect(esc("hello")).toBe("hello");
  });

  it("returns empty string for null/undefined/empty", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
    expect(esc("")).toBe("");
  });

  it("quotes values containing delimiters and escapes quotes", () => {
    expect(esc("a,b")).toBe('"a,b"');
    expect(esc('say "hi"')).toBe('"say ""hi"""');
    expect(esc("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes spreadsheet formula injection", () => {
    expect(esc("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(esc("+1234")).toBe("'+1234");
    expect(esc("-cmd")).toBe("'-cmd");
    expect(esc("@import")).toBe("'@import");
    // Combined with quoting
    expect(esc("=A1,B1")).toBe("\"'=A1,B1\"");
  });

  it("row joins with commas", () => {
    expect(row(["a", null, "b,c"])).toBe('a,,"b,c"');
  });
});
