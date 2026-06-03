import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artist: {
        include: {
          artworkImages: { orderBy: { sortOrder: "asc" } },
          placeRelations: { include: { place: true } },
          intake: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  // First time: no artist profile yet
  if (!user.artist) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-medium text-stone-900 dark:text-stone-100 mb-4">Welcome to Art Here Portland</h1>
          <p className="text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
            You&rsquo;re signed in as <span className="text-stone-700 dark:text-stone-300">{user.email}</span>.<br />
            Let&rsquo;s set up your artist profile.
          </p>
          <Link
            href="/profile/edit"
            className="inline-block bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-8 py-3 rounded-md font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
          >
            Create your profile
          </Link>
        </div>
      </main>
    );
  }

  const artist = user.artist;
  const heroImage =
    artist.artworkImages.find((img) => img.isHero) ??
    artist.artworkImages[0] ??
    null;
  const bioPhoto = artist.bioPhotoUrl ?? heroImage?.url ?? null;
  const galleryImages = artist.artworkImages.filter(
    (img) => !img.isHero && img.id !== heroImage?.id
  );

  const commissionLabel: Record<string, string> = {
    OPEN: "Open for commissions",
    CLOSED: "Not taking commissions",
    ON_REQUEST: "Commissions by request",
    UNSPECIFIED: "",
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Header / nav */}
      <div className="flex justify-between items-center mb-10">
        <a href="/" className="text-stone-400 dark:text-stone-500 text-sm hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
          ← Art Here Portland
        </a>
        <Link
          href="/profile/edit"
          className="text-sm text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-4 py-2 rounded-md hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
        >
          Edit profile
        </Link>
      </div>

      {/* Hero image */}
      {heroImage && (
        <div className="mb-8 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800">
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

      {/* Artist identity */}
      <div className="flex items-start gap-5 mb-8">
        {bioPhoto && (
          <div className="flex-shrink-0">
            <Image
              src={bioPhoto}
              alt={artist.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-medium text-stone-900 dark:text-stone-100">{artist.name}</h1>
          {artist.placeRelations.length > 0 && (
            <p className="text-stone-500 dark:text-stone-400 mt-1">
              {artist.placeRelations
                .map((r) => `${r.place.name}`)
                .join(" · ")}
            </p>
          )}
          {commissionLabel[artist.commissionStatus] && (
            <span
              className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full ${
                artist.commissionStatus === "OPEN"
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                  : artist.commissionStatus === "ON_REQUEST"
                  ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
              }`}
            >
              {commissionLabel[artist.commissionStatus]}
            </span>
          )}
        </div>
      </div>

      {/* Bio */}
      {artist.bio && (
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-10 whitespace-pre-wrap">{artist.bio}</p>
      )}

      {/* Gallery — adaptive grid */}
      {galleryImages.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Work</h2>
          <div
            className={`grid gap-3 ${
              galleryImages.length === 1
                ? "grid-cols-1"
                : galleryImages.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {galleryImages.map((img) => (
              <div key={img.id} className="rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 aspect-square">
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

      {/* Links */}
      {(artist.website || artist.instagram) && (
        <section className="border-t border-stone-100 dark:border-stone-800 pt-6 flex gap-4">
          {artist.website && (
            <a
              href={artist.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-500 dark:text-stone-400 text-sm hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
            >
              Website ↗
            </a>
          )}
          {artist.instagram && (
            <a
              href={`https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-500 dark:text-stone-400 text-sm hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
            >
              Instagram ↗
            </a>
          )}
        </section>
      )}
    </main>
  );
}
