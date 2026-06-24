import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminProfileEditor from "./AdminProfileEditor";
import AdminImageManager from "./AdminImageManager";

export default async function AdminArtistEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [artist, places] = await Promise.all([
    prisma.artist.findUnique({
      where: { id },
      include: {
        artworkImages: { orderBy: { sortOrder: "asc" } },
        placeRelations: { include: { place: true } },
        intake: true,
      },
    }),
    prisma.place.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!artist) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/artists/${id}`}
        className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors mb-6 inline-block"
      >
        ← Back to {artist.name}
      </Link>
      <h1 className="text-2xl font-medium mb-8">Edit Profile — {artist.name}</h1>

      {/* Images */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 mb-6">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-4">Images</h2>
        <AdminImageManager
          artistId={artist.id}
          initialImages={artist.artworkImages}
          initialBioPhotoUrl={artist.bioPhotoUrl}
        />
      </div>

      <AdminProfileEditor artist={artist} places={places} />
    </div>
  );
}
