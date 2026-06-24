import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const [surveyCount, artistCount, userCount, noteCount] = await Promise.all([
    prisma.surveyResponse.count(),
    prisma.artist.count(),
    prisma.user.count(),
    prisma.adminNote.count(),
  ]);

  const recentSurveys = await prisma.surveyResponse.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, createdAt: true, email: true, artistStatus: true, zipCode: true },
  });

  const recentArtists = await prisma.artist.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, medium: true, createdAt: true, bioPhotoUrl: true, slug: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-medium mb-8">Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Survey Responses", value: surveyCount, href: "/admin/survey" },
          { label: "Artist Profiles", value: artistCount, href: "/admin/artists" },
          { label: "Registered Users", value: userCount, href: "/admin/artists" },
          { label: "Admin Notes", value: noteCount, href: "/admin/artists" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white border border-[#e5e5e5] rounded-lg p-6 hover:border-[#ccc] transition-colors"
          >
            <div className="text-3xl font-medium text-[#1a1a1a] mb-1">{stat.value}</div>
            <div className="text-sm text-[#888]">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent survey responses */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Recent Survey Responses</h2>
            <Link href="/admin/survey" className="text-sm text-[#888] hover:text-[#1a1a1a]">
              View all →
            </Link>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
            {recentSurveys.length === 0 && (
              <p className="p-4 text-sm text-[#999]">No responses yet.</p>
            )}
            {recentSurveys.map((r) => (
              <Link
                key={r.id}
                href={`/admin/survey#${r.id}`}
                className="flex justify-between items-center px-4 py-3 hover:bg-[#fafafa] transition-colors"
              >
                <div>
                  <div className="text-sm font-medium">{r.email ?? "Anonymous"}</div>
                  <div className="text-xs text-[#999]">
                    {r.artistStatus ?? "—"} · {r.zipCode ?? "no zip"}
                  </div>
                </div>
                <div className="text-xs text-[#bbb]">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent artists */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Recent Artist Profiles</h2>
            <Link href="/admin/artists" className="text-sm text-[#888] hover:text-[#1a1a1a]">
              View all →
            </Link>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
            {recentArtists.length === 0 && (
              <p className="p-4 text-sm text-[#999]">No artists yet.</p>
            )}
            {recentArtists.map((a) => (
              <Link
                key={a.id}
                href={`/admin/artists/${a.id}`}
                className="flex justify-between items-center px-4 py-3 hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {a.bioPhotoUrl ? (
                    <img
                      src={a.bioPhotoUrl}
                      alt={a.name}
                      className="w-8 h-8 rounded-full object-cover bg-[#f0f0f0]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[#bbb] text-xs">
                      {a.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-[#999]">{a.medium ?? "—"}</div>
                  </div>
                </div>
                <div className="text-xs text-[#bbb]">
                  {new Date(a.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
