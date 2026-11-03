import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";
import OrganizationsList from "./OrganizationsList";
import OrganizationCharts from "./OrganizationCharts";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; field?: string; value?: string }>;
}) {
  await requireAdminPage();

  const { filter: filterParam, field: activeField, value: activeValue } = await searchParams;
  // Chart bars link with ?field=status&value=Live; fold those into the same
  // filter names the header chips use.
  const statusFilters: Record<string, string> = { Live: "live", Hidden: "hidden", "Needs review": "needsReview" };
  const filter = filterParam ?? (activeField === "status" && activeValue ? statusFilters[activeValue] : undefined);

  const [placeRows, lastPlaceEdits] = await Promise.all([
    prisma.place.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        _count: { select: { artists: true, adminNotes: true } },
      },
    }),
    // Latest self-service edit per place, in one query rather than one per
    // row — see Place.lastPlaceEditAt below.
    prisma.profileRevision.groupBy({
      by: ["entityId"],
      where: { entityType: "place", editedBy: "place" },
      _max: { createdAt: true },
    }),
  ]);
  const lastPlaceEditMap = new Map(lastPlaceEdits.map((r) => [r.entityId, r._max.createdAt]));
  const allPlaces = placeRows.map((p) => ({ ...p, lastPlaceEditAt: lastPlaceEditMap.get(p.id) ?? null }));

  // Archived pages are tucked out of the default view entirely, same as
  // artists — see setPlacesArchived.
  const nonArchived = allPlaces.filter((p) => !p.isArchived);
  const archivedCount = allPlaces.length - nonArchived.length;

  const liveCount = nonArchived.filter((p) => p.inDirectory).length;
  const needsReviewCount = nonArchived.filter((p) => p.submittedForReviewAt != null).length;

  const statusData = [
    { label: "Live", count: liveCount },
    { label: "Hidden", count: nonArchived.length - liveCount },
    { label: "Needs review", count: needsReviewCount },
  ]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ ...d, pct: Math.round((d.count / (nonArchived.length || 1)) * 100) }));

  const neighborhoodCounts: Record<string, number> = {};
  for (const p of nonArchived) if (p.neighborhood) neighborhoodCounts[p.neighborhood] = (neighborhoodCounts[p.neighborhood] ?? 0) + 1;
  const neighborhoodData = Object.entries(neighborhoodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round((count / (nonArchived.length || 1)) * 100) }));

  const byFilter =
    filter === "live" ? nonArchived.filter((p) => p.inDirectory)
    : filter === "hidden" ? nonArchived.filter((p) => !p.inDirectory)
    : filter === "needsReview" ? nonArchived.filter((p) => p.submittedForReviewAt != null)
    : filter === "archived" ? allPlaces.filter((p) => p.isArchived)
    : nonArchived;
  const places =
    activeField === "neighborhood" && activeValue ? byFilter.filter((p) => p.neighborhood === activeValue) : byFilter;

  const totalForLabel = filter === "archived" ? archivedCount : nonArchived.length;
  const countLabel = filter || (activeField && activeValue) ? `${places.length} of ${totalForLabel}` : `${totalForLabel}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Organizations</h1>
          <span className="text-sm text-[#888]">{countLabel} pages</span>
          <span className="text-sm text-green-700">{liveCount} live</span>
          {needsReviewCount > 0 && (
            <Link href="/admin/organizations?filter=needsReview" className="text-sm text-[#a84573] hover:underline">
              {needsReviewCount} awaiting review
            </Link>
          )}
          {archivedCount > 0 && (
            <Link href="/admin/organizations?filter=archived" className="text-sm text-[#999] hover:underline">
              {archivedCount} archived
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-xs">
            <Link
              href="/admin/organizations?filter=live"
              className={`px-3 py-1.5 rounded-full border transition-colors ${filter === "live" ? "bg-green-50 border-green-300 text-green-700" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Live
            </Link>
            <Link
              href="/admin/organizations?filter=hidden"
              className={`px-3 py-1.5 rounded-full border transition-colors ${filter === "hidden" ? "bg-[#f062a4]/10 border-[#f062a4]/40 text-[#a84573]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Hidden
            </Link>
            {needsReviewCount > 0 && (
              <Link
                href="/admin/organizations?filter=needsReview"
                className={`px-3 py-1.5 rounded-full border transition-colors ${filter === "needsReview" ? "bg-[#f062a4]/10 border-[#f062a4]/40 text-[#a84573]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
              >
                Needs review
              </Link>
            )}
            {archivedCount > 0 && (
              <Link
                href="/admin/organizations?filter=archived"
                className={`px-3 py-1.5 rounded-full border transition-colors ${filter === "archived" ? "bg-[#e5e5e5] border-[#ccc] text-[#555]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
              >
                Archived
              </Link>
            )}
            {(filter || (activeField && activeValue)) && (
              <Link href="/admin/organizations" className="px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#bbb] hover:border-[#999]">
                Clear ✕
              </Link>
            )}
          </div>
          <a
            href="/api/admin/export/organizations"
            download
            className="text-sm px-4 py-2 border border-[#e5e5e5] rounded-full text-[#555] hover:border-[#999] transition-colors"
          >
            Export CSV
          </a>
        </div>
      </div>

      {nonArchived.length > 0 && (
        <OrganizationCharts
          statusData={statusData}
          neighborhoodData={neighborhoodData}
          total={nonArchived.length}
          activeField={activeField}
          activeValue={activeValue}
        />
      )}

      <OrganizationsList places={places} />
    </div>
  );
}
