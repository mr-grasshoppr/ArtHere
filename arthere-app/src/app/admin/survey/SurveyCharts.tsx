"use client";

type ChartData = { label: string; count: number; pct: number }[];

function HorizontalBarChart({
  title,
  data,
  total,
  fieldKey,
  activeValue,
}: {
  title: string;
  data: ChartData;
  total: number;
  fieldKey: string;
  activeValue?: string;
}) {
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
            ? "/admin/survey"
            : `/admin/survey?field=${encodeURIComponent(fieldKey)}&value=${encodeURIComponent(row.label)}`;
          return (
            <a key={row.label} href={href} className="block group">
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
            </a>
          );
        })}
      </div>
      {activeValue && (
        <a href="/admin/survey" className="inline-block mt-3 text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">
          ✕ Clear filter
        </a>
      )}
    </div>
  );
}

export default function SurveyCharts({
  artistStatusData,
  goalsData,
  activitiesData,
  participateData,
  totalResponses,
  artistCount,
  activeField,
  activeValue,
}: {
  artistStatusData: ChartData;
  goalsData: ChartData;
  activitiesData: ChartData;
  participateData: ChartData;
  totalResponses: number;
  artistCount: number;
  activeField?: string;
  activeValue?: string;
}) {
  return (
    <div className="mb-10">
      <h2 className="font-medium mb-4 text-[#888] text-sm uppercase tracking-wide">Response Breakdown</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <HorizontalBarChart
          title="Are you a practicing artist?"
          data={artistStatusData}
          total={totalResponses}
          fieldKey="artistStatus"
          activeValue={activeField === "artistStatus" ? activeValue : undefined}
        />
        <HorizontalBarChart
          title="Participate / volunteer"
          data={participateData}
          total={totalResponses}
          fieldKey="participate"
          activeValue={activeField === "participate" ? activeValue : undefined}
        />
        <HorizontalBarChart
          title="Current goals as an artist"
          data={goalsData}
          total={artistCount}
          fieldKey="practiceGoals"
          activeValue={activeField === "practiceGoals" ? activeValue : undefined}
        />
        <HorizontalBarChart
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
