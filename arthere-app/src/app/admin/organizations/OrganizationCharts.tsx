"use client";

import { HorizontalBarChart, type ChartData } from "@/components/admin/HorizontalBarChart";

export default function OrganizationCharts({
  statusData,
  neighborhoodData,
  total,
  activeField,
  activeValue,
}: {
  statusData: ChartData;
  neighborhoodData: ChartData;
  total: number;
  activeField?: string;
  activeValue?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="font-medium mb-4 text-[#888] text-sm uppercase tracking-wide">Page Breakdown</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <HorizontalBarChart
          baseHref="/admin/organizations"
          title="Status"
          data={statusData}
          total={total}
          fieldKey="status"
          activeValue={activeField === "status" ? activeValue : undefined}
        />
        <HorizontalBarChart
          baseHref="/admin/organizations"
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
