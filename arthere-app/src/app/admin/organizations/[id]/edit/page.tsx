import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrgEditor from "./OrgEditor";

export default async function AdminOrgEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;

  const place = await prisma.place.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  if (!place) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/organizations/${id}`}
        className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors mb-6 inline-block"
      >
        ← Back to {place.name}
      </Link>
      <h1 className="text-2xl font-medium mb-8">Edit Organization — {place.name}</h1>

      <OrgEditor
        place={{
          id: place.id,
          name: place.name,
          neighborhood: place.neighborhood ?? "",
          description: place.description ?? "",
          website: place.website ?? "",
          email: place.user?.email ?? "",
          heroImageUrl: place.heroImageUrl,
          thumbnailImageUrl: place.thumbnailImageUrl,
          galleryImages: place.galleryImages,
        }}
      />
    </div>
  );
}
