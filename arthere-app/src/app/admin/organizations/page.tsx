import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";
import OrganizationsList from "./OrganizationsList";
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

  // Archived pages are tucked out of the default view entirely, same as
  // artists — see setPlacesArchived.
  const nonArchived = allPlaces.filter((p) => !p.isArchived);
  const archivedCount = allPlaces.length - nonArchived.length;

  const liveCount = nonArchived.filter((p) => p.inDirectory).length;

  const places =
    filter === "live" ? nonArchived.filter((p) => p.inDirectory)
    : filter === "hidden" ? nonArchived.filter((p) => !p.inDirectory)
    : filter === "archived" ? allPlaces.filter((p) => p.isArchived)
    : nonArchived;

  const totalForLabel = filter === "archived" ? archivedCount : nonArchived.length;
  const countLabel = filter ? `${places.length} of ${totalForLabel}` : `${totalForLabel}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Organizations</h1>
          <span className="text-sm text-[#888]">{countLabel} pages</span>
          <span className="text-sm text-green-700">{liveCount} live</span>
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
              className={`px-3 py-1.5 rounded-full border transition-colors ${filter === "hidden" ? "bg-amber-50 border-amber-300 text-amber-700" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Hidden
            </Link>
            {archivedCount > 0 && (
              <Link
                href="/admin/organizations?filter=archived"
                className={`px-3 py-1.5 rounded-full border transition-colors ${filter === "archived" ? "bg-[#e5e5e5] border-[#ccc] text-[#555]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
              >
                Archived
              </Link>
            )}
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

      <div className="mt-6">
        <OrganizationsList places={places} />
      </div>
    </div>
  );
}
