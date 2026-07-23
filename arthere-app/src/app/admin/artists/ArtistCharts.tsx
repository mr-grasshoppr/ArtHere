"use client";

import { HorizontalBarChart, type ChartData } from "@/components/admin/HorizontalBarChart";

export default function ArtistCharts({
  mediumData,
  neighborhoodData,
  total,
  activeField,
  activeValue,
}: {
  mediumData: ChartData;
  neighborhoodData: ChartData;
  total: number;
  activeField?: string;
  activeValue?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="font-medium mb-4 text-[#888] text-sm uppercase tracking-wide">Profile Breakdown</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <HorizontalBarChart
          baseHref="/admin/artists"
          title="Medium"
          data={mediumData}
          total={total}
          fieldKey="medium"
          activeValue={activeField === "medium" ? activeValue : undefined}
        />
        <HorizontalBarChart
          baseHref="/admin/artists"
          title="Neighborhood"
          data={neighborhoodData}
          total={total}
          fieldKey="neighborhood"
          activeValue={activeField === "neighborhood" ? activeValue : undefined}
        />
      </div>
    </div>
  );
}
