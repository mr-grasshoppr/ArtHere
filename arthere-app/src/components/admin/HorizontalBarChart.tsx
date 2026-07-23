"use client";

import Link from "next/link";

export type ChartData = { label: string; count: number; pct: number }[];

interface Props {
  title: string;
  data: ChartData;
  total: number;
  fieldKey: string;
  /** Route the bars filter, e.g. "/admin/survey" or "/admin/artists". */
  baseHref: string;
  activeValue?: string;
}

/**
 * Clickable horizontal bar chart used across the admin dashboards. Each bar
 * links to the same page filtered by ?field=<fieldKey>&value=<label>;
 * clicking the active bar clears the filter.
 */
export function HorizontalBarChart({ title, data, total, fieldKey, baseHref, activeValue }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
      <div className="flex justify-between items-baseline mb-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="text-xs text-[#bbb]">n={total}</span>
      </div>
      <div className="space-y-2">
        {data.map((row) => {
          const isActive = activeValue === row.label;
          const href = isActive
            ? baseHref
            : `${baseHref}?field=${encodeURIComponent(fieldKey)}&value=${encodeURIComponent(row.label)}`;
          return (
            <Link key={row.label} href={href} className="block group">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className={`text-xs leading-snug pr-4 flex-1 transition-colors ${isActive ? "text-[#1a1a1a] font-medium" : "text-[#444] group-hover:text-[#1a1a1a]"}`}>
                  {row.label}
                </span>
                <span className="text-xs text-[#999] flex-shrink-0 w-14 text-right">
                  {row.count} <span className="text-[#ccc]">({row.pct}%)</span>
                </span>
              </div>
              <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isActive ? "bg-[#1a1a1a]" : "bg-[#ccc] group-hover:bg-[#888]"}`}
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
      {activeValue && (
        <Link href={baseHref} className="inline-block mt-3 text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">
          ✕ Clear filter
        </Link>
      )}
    </div>
  );
}
