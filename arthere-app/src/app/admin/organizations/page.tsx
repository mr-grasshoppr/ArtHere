import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";
import OrgVisibilityToggle from "./OrgVisibilityToggle";
import NewOrganizationForm from "./NewOrganizationForm";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdminPage();

  const { filter } = await searchParams;

  const allPlaces = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      _count: { select: { artists: true, adminNotes: true } },
    },
  });

  const liveCount = allPlaces.filter((p) => p.inDirectory).length;

  const places =
    filter === "live" ? allPlaces.filter((p) => p.inDirectory)
    : filter === "hidden" ? allPlaces.filter((p) => !p.inDirectory)
    : allPlaces;

  const countLabel = filter ? `${places.length} of ${allPlaces.length}` : `${allPlaces.length}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Organizations</h1>
          <span className="text-sm text-[#888]">{countLabel} pages</span>
          <span className="text-sm text-green-700">{liveCount} live</span>
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
              className={`px-3 py-1.5 rounded-full border transition-colors ${filter === "hidden" ? "bg-amber-50 border-amber-300 text-amber-700" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Hidden
            </Link>
            {filter && (
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

      <NewOrganizationForm />

      <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0] mt-6">
        {places.length === 0 && (
          <p className="p-6 text-sm text-[#999]">No organizations yet.</p>
        )}
        {places.map((p) => (
          <Link
            key={p.id}
            href={`/admin/organizations/${p.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors"
          >
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f0f0f0] flex-shrink-0">
              {p.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.heroImageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xl font-light">
                  {p.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-sm text-[#888] truncate">
                {p.user?.email ?? "no owner email"} · {p.neighborhood ?? "no neighborhood"}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#bbb] flex-shrink-0">
              <span>{p._count.artists} artists</span>
              <span>{p._count.adminNotes} notes</span>
              <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              <OrgVisibilityToggle placeId={p.id} inDirectory={p.inDirectory} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
