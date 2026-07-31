import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";
import ArtistCharts from "./ArtistCharts";
import VisibilityToggle from "./VisibilityToggle";
import { mediumMatches, parseMediumList } from "@/lib/artist-options";

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

// Artists can list more than one medium (a comma-joined field) — tally each
// individual medium rather than each distinct combination string.
function tallyMedium(values: (string | null)[], total: number) {
  return tally(values.flatMap(parseMediumList), total);
}

export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string; value?: string }>;
}) {
  await requireAdminPage();

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

  const mediumData = tallyMedium(allArtists.map((a) => a.medium), allArtists.length);
  const neighborhoodData = tally(allArtists.map((a) => a.neighborhood), allArtists.length);

  const artists =
    activeField && activeValue
      ? allArtists.filter((a) => {
          if (activeField === "medium") return mediumMatches(a.medium, activeValue);
          if (activeField === "neighborhood") return a.neighborhood === activeValue;
          if (activeField === "placeholder") return String(a.isPlaceholder) === activeValue;
          return true;
        })
      : allArtists;

  const liveCount = allArtists.filter((a) => !a.isPlaceholder).length;
  const countLabel = activeField && activeValue
    ? `${artists.length} of ${allArtists.length}`
    : `${allArtists.length}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Artist Profiles</h1>
          <span className="text-sm text-[#888]">{countLabel} profiles</span>
          <span className="text-sm text-green-700">{liveCount} live</span>
          {activeField && activeValue && (
            <span className="text-sm bg-[#f0f0f0] px-2 py-0.5 rounded-full text-[#555]">
              {activeField === "placeholder" ? (activeValue === "true" ? "Placeholder" : "Real") : activeValue}
              <Link href="/admin/artists" className="ml-1.5 text-[#bbb] hover:text-[#555]">✕</Link>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-xs">
            <Link
              href="/admin/artists?field=placeholder&value=true"
              className={`px-3 py-1.5 rounded-full border transition-colors ${activeField === "placeholder" && activeValue === "true" ? "bg-amber-50 border-amber-300 text-amber-700" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Placeholder
            </Link>
            <Link
              href="/admin/artists?field=placeholder&value=false"
              className={`px-3 py-1.5 rounded-full border transition-colors ${activeField === "placeholder" && activeValue === "false" ? "bg-green-50 border-green-300 text-green-700" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Real
            </Link>
          </div>
          <a
            href="/api/admin/export/artists"
            download
            className="text-sm px-4 py-2 border border-[#e5e5e5] rounded-full text-[#555] hover:border-[#999] transition-colors"
          >
            Export CSV
          </a>
        </div>
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
                  <span className="font-medium truncate">{a.name || <span className="text-[#bbb] italic">(no name)</span>}</span>
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
                <VisibilityToggle artistId={a.id} isPlaceholder={a.isPlaceholder} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
