import { prisma } from "@/lib/db";
import Link from "next/link";
import ArtistCharts from "./ArtistCharts";

function tally(values: (string | null)[], total: number) {
  const counts: Record<string, number> = {};
  for (const v of values) {
    if (!v) continue;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round((count / (total || 1)) * 100) }));
}

export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string; value?: string }>;
}) {
  const { field: activeField, value: activeValue } = await searchParams;

  const allArtists = await prisma.artist.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, emailVerified: true } },
      artworkImages: { select: { id: true, url: true, isHero: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      adminNotes: { select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { adminNotes: true } },
    },
  });

  const mediumData = tally(allArtists.map((a) => a.medium), allArtists.length);
  const neighborhoodData = tally(allArtists.map((a) => a.neighborhood), allArtists.length);

  const artists =
    activeField && activeValue
      ? allArtists.filter((a) => {
          if (activeField === "medium") return a.medium === activeValue;
          if (activeField === "neighborhood") return a.neighborhood === activeValue;
          return true;
        })
      : allArtists;

  const countLabel = activeField && activeValue
    ? `${artists.length} of ${allArtists.length}`
    : `${allArtists.length}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-medium">Artist Profiles</h1>
          <span className="text-sm text-[#888]">{countLabel} profiles</span>
          {activeField && activeValue && (
            <span className="text-sm bg-[#f0f0f0] px-2 py-0.5 rounded-full text-[#555]">
              {activeValue}
              <a href="/admin/artists" className="ml-1.5 text-[#bbb] hover:text-[#555]">✕</a>
            </span>
          )}
        </div>
        <a
          href="/api/admin/export/artists"
          download
          className="text-sm px-4 py-2 border border-[#e5e5e5] rounded-full text-[#555] hover:border-[#999] transition-colors"
        >
          Export CSV
        </a>
      </div>

      {allArtists.length > 0 && (
        <ArtistCharts
          mediumData={mediumData}
          neighborhoodData={neighborhoodData}
          total={allArtists.length}
          activeField={activeField}
          activeValue={activeValue}
        />
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
        {artists.length === 0 && (
          <p className="p-6 text-sm text-[#999]">No artist profiles match this filter.</p>
        )}
        {artists.map((a) => {
          const heroImage = a.artworkImages.find((i) => i.isHero) ?? a.artworkImages[0];
          return (
            <Link
              key={a.id}
              href={`/admin/artists/${a.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors"
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f0f0f0] flex-shrink-0">
                {heroImage ? (
                  <img src={heroImage.url} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xl font-light">
                    {a.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{a.name}</span>
                  {a.isPlaceholder && (
                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">placeholder</span>
                  )}
                  {a.user.emailVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">verified</span>
                  )}
                </div>
                <div className="text-sm text-[#888] truncate">
                  {a.user.email} · {a.medium ?? "no medium"} · {a.neighborhood ?? "no neighborhood"}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-[#bbb] flex-shrink-0">
                <span>{a.artworkImages.length} images</span>
                <span>{a._count.adminNotes} notes</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
