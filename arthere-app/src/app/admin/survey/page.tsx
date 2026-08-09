import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";
import SurveyTable from "./SurveyTable";
import SurveyCharts from "./SurveyCharts";
import SurveyFunnel from "./SurveyFunnel";
import {
  NOT_MAKING_ART_VALUES,
  INVOLVEMENT_FEATURED,
  INVOLVEMENT_VOLUNTEER,
  RAFFLE_YES,
} from "@/lib/survey-constants";

// Older responses (before the "Get Involved" redesign) stored these answers
// in the now-deprecated stayConnected / featuredArtistInterest /
// multnomahDaysInvolvement fields — keep counting them.
type LegacyFields = {
  stayConnected: string[];
  featuredArtistInterest: string | null;
  multnomahDaysInvolvement: string[];
  involvementInterests: string[];
};

function wantsToVolunteer(r: LegacyFields) {
  return r.involvementInterests.includes(INVOLVEMENT_VOLUNTEER) || r.stayConnected.includes("Volunteer");
}

function wantsToBeFeatured(r: LegacyFields) {
  return r.involvementInterests.includes(INVOLVEMENT_FEATURED) || !!r.featuredArtistInterest?.startsWith("Yes");
}

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
  await requireAdminPage();

  const { filter: activeFilter, field: activeField, value: activeValue } = await searchParams;

  const responses = await prisma.surveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Exclude test responses from stats, funnel, and charts; the table handles show/hide itself.
  const realResponses = responses.filter((r) => !r.isTest);

  // ── Drop-off funnel ────────────────────────────────────────────────────────
  // Each step's count = how many responses have data for that step's sentinel field.
  // Since the form saves a draft on every Next click, partial responses tell us
  // exactly how far someone got.
  const funnelSteps = [
    { label: "Started", count: realResponses.length },
    { label: "Location", count: realResponses.filter((r) => !!(r.zipCode || r.neighborhoods)).length },
    { label: "About You", count: realResponses.filter((r) => !!r.artistStatus).length },
    { label: "Portland Familiarity", count: realResponses.filter((r) => !!r.portlandFamiliarity).length },
    { label: "Discovery", count: realResponses.filter((r) => !!(r.discoveryEase || r.discoveryChannel.length)).length },
    { label: "Portland Support", count: realResponses.filter((r) => !!(r.portlandHelpers || r.portlandSupport.length)).length },
    { label: "Involvement", count: realResponses.filter((r) => r.involvementInterests.length > 0).length },
    { label: "Email / Raffle", count: realResponses.filter((r) => !!r.raffleOptIn).length },
    {
      label: "Completed",
      // completedAt is authoritative for new responses; the learnedAbout /
      // openFeedback heuristic covers rows submitted before it existed.
      count: realResponses.filter((r) => r.completedAt != null || r.learnedAbout.length > 0 || !!r.openFeedback).length,
    },
  ];

  const artistOnly = realResponses.filter((r) => r.artistStatus && !NOT_MAKING_ART_VALUES.includes(r.artistStatus));
  const artistFunnelSteps = [
    { label: "Are making art", count: artistOnly.length },
    { label: "Career Stage", count: artistOnly.filter((r) => !!r.careerStage).length },
    { label: "Practice Activities", count: artistOnly.filter((r) => r.practiceActivities.length > 0).length },
    { label: "Practice Goals", count: artistOnly.filter((r) => r.practiceGoals.length > 0).length },
  ];

  const artistResponses = artistOnly;

  const artistStatusData = tally(
    realResponses.map((r) => r.artistStatus).filter(Boolean) as string[],
    realResponses.length
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
    realResponses
      .flatMap((r) => [...r.involvementInterests, ...r.stayConnected, ...r.multnomahDaysInvolvement])
      .filter(Boolean),
    realResponses.length
  );

  const completedResponses = realResponses.filter(
    (r) => r.completedAt != null || r.learnedAbout.length > 0 || !!r.openFeedback
  );

  const stats = {
    total: completedResponses.length,
    drafts: realResponses.length - completedResponses.length,
    volunteer: realResponses.filter(wantsToVolunteer).length,
    featured: realResponses.filter(wantsToBeFeatured).length,
    raffle: realResponses.filter((r) => r.raffleOptIn === RAFFLE_YES).length,
  };

  const cards = [
    {
      key: "total",
      label: `Completed surveys${stats.drafts > 0 ? ` (+${stats.drafts} drafts)` : ""}`,
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

      <SurveyFunnel
        steps={funnelSteps}
        artistSteps={artistFunnelSteps}
        total={realResponses.length}
      />

      <SurveyCharts
        artistStatusData={artistStatusData}
        goalsData={goalsData}
        activitiesData={activitiesData}
        participateData={participateData}
        totalResponses={realResponses.length}
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
