// Turning raw "search" events into the tables on /admin/analytics. Kept apart
// from the page so it can be tested without a database.

export interface SearchSummary {
  total: number;
  /** For each filter (medium, neighborhood, places): its values, most searched first. */
  byFilter: Record<string, { value: string; count: number }[]>;
  /** Searches that combined two or more filters, most common first. */
  combos: { label: string; count: number }[];
  /** Searches that matched nothing — demand the directory can't meet yet. */
  empty: { label: string; count: number }[];
}

const FILTER_ORDER = ["medium", "neighborhood", "places"];

function parse(meta: unknown): { filters: Record<string, string[]>; results: number } | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as { filters?: unknown; results?: unknown };
  if (!m.filters || typeof m.filters !== "object") return null;
  const filters: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(m.filters as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      const values = v.filter((x): x is string => typeof x === "string" && x.length > 0);
      if (values.length > 0) filters[k] = values;
    }
  }
  if (Object.keys(filters).length === 0) return null;
  return { filters, results: typeof m.results === "number" ? m.results : -1 };
}

function describe(filters: Record<string, string[]>): string {
  return Object.keys(filters)
    .sort((a, b) => FILTER_ORDER.indexOf(a) - FILTER_ORDER.indexOf(b))
    .map((k) => `${k}: ${[...filters[k]].sort().join(" + ")}`)
    .join(" · ");
}

function ranked(counts: Map<string, number>, limit: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

/**
 * Each settled search counts once toward every value it included, so a search
 * for Painting + Pearl adds one to each. Someone refining a search (adding a
 * second filter) is a new settled search, so a value can be counted again —
 * these are "searches that included X", not unique people.
 */
export function summarizeSearches(rows: { meta: unknown }[], limit = 15): SearchSummary {
  const perFilter = new Map<string, Map<string, number>>();
  const combos = new Map<string, number>();
  const empty = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    const s = parse(row.meta);
    if (!s) continue;
    total++;
    for (const [filter, values] of Object.entries(s.filters)) {
      const counts = perFilter.get(filter) ?? new Map<string, number>();
      for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
      perFilter.set(filter, counts);
    }
    const label = describe(s.filters);
    if (Object.keys(s.filters).length > 1) combos.set(label, (combos.get(label) ?? 0) + 1);
    if (s.results === 0) empty.set(label, (empty.get(label) ?? 0) + 1);
  }

  const byFilter: SearchSummary["byFilter"] = {};
  for (const [filter, counts] of perFilter) {
    byFilter[filter] = ranked(counts, limit).map(([value, count]) => ({ value, count }));
  }
  return {
    total,
    byFilter,
    combos: ranked(combos, limit).map(([label, count]) => ({ label, count })),
    empty: ranked(empty, limit).map(([label, count]) => ({ label, count })),
  };
}

/** Percent change from `prev` to `current`; null when there's nothing to compare. */
export function pctChange(current: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}
