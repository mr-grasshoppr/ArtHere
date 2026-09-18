import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrgEditor from "./OrgEditor";
import { getFocals } from "@/lib/image-focus";
import { getKnownNeighborhoods } from "@/lib/neighborhoods";

export default async function AdminOrgEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      links: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!place) notFound();

  const [initialFocalsEntries, neighborhoodOptions] = await Promise.all([
    getFocals([place.heroImageUrl, place.thumbnailImageUrl, ...place.galleryImages]),
    getKnownNeighborhoods(),
  ]);
  const initialFocals = Object.fromEntries(initialFocalsEntries);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/admin/organizations/${id}`}
          className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors"
        >
          ← Back to {place.name}
        </Link>
        <Link
          href={`/places/${place.slug}`}
          target="_blank"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#e0e0e0] text-xs font-medium text-[#444] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
        >
          View page ↗
        </Link>
      </div>
      <h1 className="text-2xl font-medium mb-8">Edit Organization — {place.name}</h1>

      <OrgEditor
        place={{
          id: place.id,
          name: place.name,
          neighborhood: place.neighborhood ?? "",
          description: place.description ?? "",
          quote: place.quote ?? "",
          quoteAttribution: place.quoteAttribution ?? "",
          links: place.links.map((l) => ({ type: l.type, url: l.url, label: l.label ?? "" })),
          email: place.user?.email ?? "",
          heroImageUrl: place.heroImageUrl,
          thumbnailImageUrl: place.thumbnailImageUrl,
          galleryImages: place.galleryImages,
          inDirectory: place.inDirectory,
        }}
        neighborhoodOptions={neighborhoodOptions}
        initialFocals={initialFocals}
      />
    </div>
  );
}
