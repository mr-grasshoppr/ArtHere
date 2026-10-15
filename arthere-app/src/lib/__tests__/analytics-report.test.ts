import { describe, it, expect } from "vitest";
import { pctChange, summarizeSearches } from "../analytics-report";

const row = (filters: Record<string, string[]>, results: number) => ({ meta: { filters, results } });

describe("summarizeSearches", () => {
  const rows = [
    row({ medium: ["Painting"] }, 12),
    row({ medium: ["Painting"] }, 12),
    row({ medium: ["Painting"], neighborhood: ["Pearl"] }, 0),
    row({ medium: ["Painting"], neighborhood: ["Pearl"] }, 0),
    row({ medium: ["Printmaking"], neighborhood: ["Alberta", "Mississippi"] }, 3),
    { meta: null },
    { meta: { filters: {} } },
  ];
  const s = summarizeSearches(rows);

  it("counts valid searches and skips malformed ones", () => {
    expect(s.total).toBe(5);
  });

  it("counts searches per filter value, most searched first", () => {
    expect(s.byFilter.medium).toEqual([
      { value: "Painting", count: 4 },
      { value: "Printmaking", count: 1 },
    ]);
    expect(s.byFilter.neighborhood.find((n) => n.value === "Pearl")?.count).toBe(2);
  });

  it("lists combinations and dead-end searches", () => {
    expect(s.combos[0]).toEqual({ label: "medium: Painting · neighborhood: Pearl", count: 2 });
    expect(s.empty).toEqual([{ label: "medium: Painting · neighborhood: Pearl", count: 2 }]);
  });
});

describe("pctChange", () => {
  it("computes the change, and null with no baseline", () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(50, 100)).toBe(-50);
    expect(pctChange(5, 0)).toBeNull();
  });
});
