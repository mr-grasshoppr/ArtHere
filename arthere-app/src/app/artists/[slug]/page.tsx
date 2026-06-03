import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export async function generateStaticParams() {
  const artists = await prisma.artist.findMany({ select: { slug: true } });
  return artists.map((a) => ({ slug: a.slug }));
}

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const artist = await prisma.artist.findUnique({
    where: { slug: params.slug },
    include: {
      artworkImages: { orderBy: { sortOrder: "asc" } },
      placeRelations: { include: { place: true } },
      intake: true,
    },
  });

  if (!artist) notFound();

  const heroImage = artist.artworkImages.find((img) => img.isHero) ?? artist.artworkImages[0] ?? null;
  const bioPhoto = artist.bioPhotoUrl ?? heroImage?.url ?? null;
  const galleryImages = artist.artworkImages.filter((img) => img.id !== heroImage?.id);

  const commissionLabel: Record<string, string> = {
    OPEN: "Open for commissions",
    CLOSED: "Not taking commissions",
    ON_REQUEST: "Commissions by request",
    UNSPECIFIED: "",
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <Link href="/artists" className="text-stone-400 text-sm hover:text-stone-600 transition-colors">
          ← All artists
        </Link>
      </div>

      {heroImage && (
        <div className="mb-8 rounded-lg overflow-hidden bg-stone-100">
          <Image
            src={heroImage.url}
            alt={heroImage.altText ?? artist.name}
            width={1200}
            height={600}
            className="w-full object-cover max-h-[420px]"
            priority
          />
        </div>
      )}

      <div className="flex items-start gap-5 mb-8">
        {bioPhoto && (
          <Image
            src={bioPhoto}
            alt={artist.name}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div>
          <h1 className="text-3xl font-medium text-stone-900">{artist.name}</h1>
          {artist.placeRelations.length > 0 && (
            <p className="text-stone-500 mt-1">
              {artist.placeRelations.map((r) => r.place.name).join(" · ")}
            </p>
          )}
          {commissionLabel[artist.commissionStatus] && (
            <span
              className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full ${
                artist.commissionStatus === "OPEN"
                  ? "bg-green-50 text-green-700"
                  : artist.commissionStatus === "ON_REQUEST"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {commissionLabel[artist.commissionStatus]}
            </span>
          )}
        </div>
      </div>

      {artist.bio && (
        <p className="text-stone-600 leading-relaxed mb-10 whitespace-pre-wrap">{artist.bio}</p>
      )}

      {/* Commission details */}
      {artist.intake && artist.commissionStatus !== "UNSPECIFIED" && artist.commissionStatus !== "CLOSED" && (
        <section className="bg-stone-50 rounded-lg p-5 mb-10 space-y-2 text-sm text-stone-600">
          {artist.intake.commissionTypes.length > 0 && (
            <p><span className="font-medium text-stone-800">Commission types:</span> {artist.intake.commissionTypes.join(", ")}</p>
          )}
          {artist.intake.turnaroundWeeks && (
            <p><span className="font-medium text-stone-800">Typical turnaround:</span> {artist.intake.turnaroundWeeks} weeks</p>
          )}
          {(artist.priceRangeMin || artist.priceRangeMax) && (
            <p>
              <span className="font-medium text-stone-800">Price range:</span>{" "}
              {artist.priceRangeMin && artist.priceRangeMax
                ? `$${artist.priceRangeMin} – $${artist.priceRangeMax}`
                : artist.priceRangeMin
                ? `From $${artist.priceRangeMin}`
                : `Up to $${artist.priceRangeMax}`}
            </p>
          )}
          {artist.intake.shipsInternationally && <p>Ships internationally</p>}
          {artist.intake.worksInPerson && <p>Available to work in person</p>}
          {artist.intake.notes && <p className="italic">&ldquo;{artist.intake.notes}&rdquo;</p>}
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-4">Work</h2>
          <div
            className={`grid gap-3 ${
              galleryImages.length === 1 ? "grid-cols-1" :
              galleryImages.length === 2 ? "grid-cols-2" :
              "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {galleryImages.map((img) => (
              <div key={img.id} className="rounded-lg overflow-hidden bg-stone-100 aspect-square">
                <Image
                  src={img.url}
                  alt={img.altText ?? ""}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {(artist.website || artist.instagram) && (
        <section className="border-t border-stone-100 pt-6 flex gap-4">
          {artist.website && (
            <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-stone-500 text-sm hover:text-stone-800 transition-colors">
              Website ↗
            </a>
          )}
          {artist.instagram && (
            <a href={`https://instagram.com/${artist.instagram}`} target="_blank" rel="noopener noreferrer" className="text-stone-500 text-sm hover:text-stone-800 transition-colors">
              Instagram ↗
            </a>
          )}
        </section>
      )}
    </main>
  );
}
