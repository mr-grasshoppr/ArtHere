import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArtistNotes from "./ArtistNotes";
import ArtistImages from "./ArtistImages";

export default async function AdminArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      user: true,
      artworkImages: { orderBy: { sortOrder: "asc" } },
      placeRelations: { include: { place: true } },
      intake: true,
      adminNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!artist) notFound();

  const commissionLabel: Record<string, string> = {
    OPEN: "Open",
    CLOSED: "Closed",
    ON_REQUEST: "On request",
    UNSPECIFIED: "Unspecified",
  };

  return (
    <div>
      {/* Back + Edit */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin/artists" className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors">
          ← All Artists
        </Link>
        <Link
          href={`/admin/artists/${id}/edit`}
          className="text-sm px-4 py-2 bg-[#1a1a1a] text-white rounded-full hover:opacity-80 transition-opacity"
        >
          Edit profile
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: profile info */}
        <div className="md:col-span-1 space-y-6">
          {/* Bio photo */}
          {artist.bioPhotoUrl && (
            <img
              src={artist.bioPhotoUrl}
              alt={artist.name}
              className="w-full aspect-square object-cover rounded-xl bg-[#f0f0f0]"
            />
          )}

          <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
            <div>
              <h1 className="text-xl font-medium">{artist.name}</h1>
              <p className="text-sm text-[#888]">/{artist.slug}</p>
            </div>

            <div className="text-sm space-y-1 pt-2 border-t border-[#f0f0f0]">
              <Row label="Email" value={artist.user.email} />
              <Row label="Verified" value={artist.user.emailVerified ? new Date(artist.user.emailVerified).toLocaleDateString() : "No"} />
              <Row label="Medium" value={artist.medium} />
              <Row label="Neighborhood" value={artist.neighborhood} />
              <Row label="Commissions" value={commissionLabel[artist.commissionStatus]} />
              {artist.priceRangeMin != null && (
                <Row label="Price range" value={`$${artist.priceRangeMin}–$${artist.priceRangeMax ?? "?"}`} />
              )}
              {artist.sizeRangeMin != null && (
                <Row label="Size range" value={`${artist.sizeRangeMin}–${artist.sizeRangeMax ?? "?"} in`} />
              )}
              <Row label="Website" value={artist.website} link />
              <Row label="Instagram" value={artist.instagram} />
            </div>

            {artist.bio && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs text-[#999] mb-1 uppercase tracking-wide">Bio</p>
                <p className="text-sm text-[#444] whitespace-pre-wrap leading-relaxed">{artist.bio}</p>
              </div>
            )}

            {artist.placeRelations.length > 0 && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs text-[#999] mb-2 uppercase tracking-wide">Places</p>
                <div className="space-y-1">
                  {artist.placeRelations.map((r) => (
                    <div key={r.id} className="text-sm">
                      <span className="font-medium">{r.place.name}</span>
                      <span className="text-[#999] ml-1">({r.relationship.toLowerCase()})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {artist.hireFor && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs text-[#999] mb-1 uppercase tracking-wide">Hire for</p>
                <p className="text-sm text-[#444]">{artist.hireFor}</p>
              </div>
            )}

            <div className="pt-2 border-t border-[#f0f0f0] flex gap-3 flex-wrap">
              <Link
                href={`/artists/${artist.slug}`}
                target="_blank"
                className="text-xs text-[#888] hover:text-[#1a1a1a] transition-colors"
              >
                Public profile ↗
              </Link>
            </div>
          </div>
        </div>

        {/* Right: images + notes */}
        <div className="md:col-span-2 space-y-8">
          <ArtistImages images={artist.artworkImages} />
          <ArtistNotes artistId={artist.id} initialNotes={artist.adminNotes} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  link,
}: {
  label: string;
  value: string | null | undefined;
  link?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[#999] w-24 flex-shrink-0">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#1a1a1a] hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-[#1a1a1a] truncate">{value}</span>
      )}
    </div>
  );
}
