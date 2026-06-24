import { prisma } from "@/lib/db";
import Link from "next/link";
import SurveyTable from "./SurveyTable";
import SurveyCharts from "./SurveyCharts";

function tally(values: string[], total: number) {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round((count / (total || 1)) * 100) }));
}

export default async function AdminSurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; field?: string; value?: string }>;
}) {
  const { filter: activeFilter, field: activeField, value: activeValue } = await searchParams;

  const responses = await prisma.surveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Respondents who are practicing artists (saw the practice/goals questions)
  const artistResponses = responses.filter(
    (r) => r.artistStatus && r.artistStatus !== "No, I'm not a practicing artist"
  );

  const artistStatusData = tally(
    responses.map((r) => r.artistStatus).filter(Boolean) as string[],
    responses.length
  );
  const goalsData = tally(
    artistResponses.flatMap((r) => r.practiceGoals),
    artistResponses.length
  );
  const activitiesData = tally(
    artistResponses.flatMap((r) => r.practiceActivities),
    artistResponses.length
  );
  const participateData = tally(
    responses.flatMap((r) => [...r.stayConnected, ...r.multnomahDaysInvolvement]).filter(Boolean),
    responses.length
  );

  const stats = {
    total: responses.length,
    volunteer: responses.filter((r) => r.stayConnected.includes("Volunteer")).length,
    featured: responses.filter((r) => r.featuredArtistInterest?.startsWith("Yes")).length,
    raffle: responses.filter((r) => r.raffleOptIn === "Yes").length,
  };

  const cards = [
    {
      key: "total",
      label: "Completed surveys",
      value: stats.total,
      href: "/admin/survey",
      color: "bg-[#f5f5f5]",
    },
    {
      key: "volunteer",
      label: "Volunteer offers",
      value: stats.volunteer,
      pct: Math.round((stats.volunteer / (stats.total || 1)) * 100),
      href: "/admin/survey?filter=volunteer",
      color: "bg-amber-50",
    },
    {
      key: "featured",
      label: "Want to be featured",
      value: stats.featured,
      pct: Math.round((stats.featured / (stats.total || 1)) * 100),
      href: "/admin/survey?filter=featured",
      color: "bg-blue-50",
    },
    {
      key: "raffle",
      label: "Raffle opt-ins",
      value: stats.raffle,
      pct: Math.round((stats.raffle / (stats.total || 1)) * 100),
      href: "/admin/survey?filter=raffle",
      color: "bg-green-50",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">Survey Responses</h1>
        <a
          href="/api/admin/export/survey"
          download
          className="text-sm px-4 py-2 border border-[#e5e5e5] rounded-full text-[#555] hover:border-[#999] transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {cards.map((card) => {
          const isActive = (activeFilter ?? "total") === card.key;
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`${card.color} rounded-xl p-5 border-2 transition-all ${
                isActive ? "border-[#1a1a1a]" : "border-transparent hover:border-[#e5e5e5]"
              }`}
            >
              <div className="text-3xl font-semibold text-[#1a1a1a] mb-0.5">{card.value}</div>
              {"pct" in card && (
                <div className="text-xs text-[#888] mb-1">{card.pct}% of responses</div>
              )}
              <div className="text-sm text-[#555]">{card.label}</div>
            </Link>
          );
        })}
      </div>

      <SurveyCharts
        artistStatusData={artistStatusData}
        goalsData={goalsData}
        activitiesData={activitiesData}
        participateData={participateData}
        totalResponses={responses.length}
        artistCount={artistResponses.length}
        activeField={activeField}
        activeValue={activeValue}
      />

      <SurveyTable
        responses={responses}
        initialFilter={activeFilter ?? "total"}
        fieldFilter={activeField && activeValue ? { field: activeField, value: activeValue } : undefined}
      />
    </div>
  );
}
