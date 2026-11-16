"use client";

import { HorizontalBarChart, type ChartData } from "@/components/admin/HorizontalBarChart";

export default function SurveyCharts({
  artistStatusData,
  goalsData,
  activitiesData,
  participateData,
  totalResponses,
  artistCount,
  activeField,
  activeValue,
  baseHref = "/admin/survey",
}: {
  artistStatusData: ChartData;
  goalsData: ChartData;
  activitiesData: ChartData;
  participateData: ChartData;
  totalResponses: number;
  artistCount: number;
  activeField?: string;
  activeValue?: string;
  baseHref?: string;
}) {
  return (
    <div className="mb-10">
      <h2 className="font-medium mb-4 text-[#888] text-sm uppercase tracking-wide">Response Breakdown</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <HorizontalBarChart
          baseHref={baseHref}
          title="Are you a practicing artist?"
          data={artistStatusData}
          total={totalResponses}
          fieldKey="artistStatus"
          activeValue={activeField === "artistStatus" ? activeValue : undefined}
        />
        <HorizontalBarChart
          baseHref={baseHref}
          title="Participate / volunteer"
          data={participateData}
          total={totalResponses}
          fieldKey="participate"
          activeValue={activeField === "participate" ? activeValue : undefined}
        />
        <HorizontalBarChart
          baseHref={baseHref}
          title="Current goals as an artist"
          data={goalsData}
          total={artistCount}
          fieldKey="practiceGoals"
          activeValue={activeField === "practiceGoals" ? activeValue : undefined}
        />
        <HorizontalBarChart
          baseHref={baseHref}
          title="Activities in the past year"
          data={activitiesData}
          total={artistCount}
          fieldKey="practiceActivities"
          activeValue={activeField === "practiceActivities" ? activeValue : undefined}
        />
      </div>
    </div>
  );
}
