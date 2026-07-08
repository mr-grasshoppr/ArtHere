import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { SiteFooter } from '@/components/SiteFooter';

export async function generateStaticParams() {
  const artists = await prisma.artist.findMany({ select: { slug: true } });
  return artists.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await prisma.artist.findUnique({ where: { slug }, select: { name: true } });
  return { title: artist ? `${artist.name} — Art Here` : 'Art Here' };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const artist = await prisma.artist.findUnique({
    where: { slug },
    include: {
      artworkImages: { orderBy: { sortOrder: 'asc' } },
      placeRelations: { orderBy: { createdAt: 'asc' }, include: { place: true } },
      city: true,
    },
  });

  if (!artist) notFound();

  const citySlug = artist.city?.slug;
  const cityDisplayName =
    artist.city?.displayName ?? (artist.city ? `${artist.city.name}${artist.city.state ? `, ${artist.city.state}` : ''}` : '');

  const heroUrl =
    artist.heroImageUrl ??
    artist.artworkImages.find(img => img.isHero)?.url ??
    artist.artworkImages[0]?.url ??
    null;

  const galleryImages = artist.artworkImages.filter(img => img.url !== heroUrl);

  const metaParts = [
    artist.medium,
    artist.neighborhood !== cityDisplayName ? artist.neighborhood : null,
    cityDisplayName,
  ].filter(Boolean);

  const bioParagraphs = (artist.bio ?? '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-full bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar activeCitySlug={citySlug} theme="light" />

      {artist.isPlaceholder && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-center text-[0.8rem] text-amber-700">
          This is a prototype profile. The artist has not yet set up their own page.
        </div>
      )}

      {/* Hero image */}
      {heroUrl && (
        <section className="relative w-full h-[38vh] min-h-[260px] overflow-hidden bg-[#f4f4f0]">
          <Image
            src={heroUrl}
            alt={`${artist.name} artwork`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </section>
      )}

      {/* Identity block — circular photo overlaps the hero bottom */}
      <div className="max-w-[980px] mx-auto px-5 sm:px-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 pb-3">
          {artist.bioPhotoUrl && (
            <div
              className={`relative w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-full overflow-hidden bg-[#f0f0f0] border-4 border-white flex-shrink-0 ${
                heroUrl ? '-mt-[55px] sm:-mt-[70px]' : ''
              }`}
            >
              <Image
                src={artist.bioPhotoUrl}
                alt={artist.name}
                fill
                sizes="140px"
                className="object-cover object-top"
              />
            </div>
          )}
          <div className="pb-1">
            <h1 className="font-heading text-[1.35rem] sm:text-[1.6rem] font-bold tracking-[-0.01em] leading-tight mb-1.5">
              {artist.name}
            </h1>
            {metaParts.length > 0 && (
              <div className="text-[0.88rem] text-[#888] font-light">
                {metaParts.join(' · ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {(bioParagraphs.length > 0 || artist.instagram || artist.website) && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pt-7 pb-10">
          <div className="max-w-[680px] text-[1.05rem] text-[#444] font-light leading-[1.8]">
            {bioParagraphs.map((p, i) => {
              const isQuote = /^["“]/.test(p) && /["”]$/.test(p);
              if (isQuote) {
                return (
                  <blockquote
                    key={i}
                    className="italic border-l-2 border-[#ccc] pl-5 mb-[18px] text-[#888] text-[0.92rem]"
                  >
                    {p}
                  </blockquote>
                );
              }
              return <p key={i} className="mb-[18px]">{p}</p>;
            })}
            {(artist.website || artist.instagram) && (
              <p className="text-[#999] text-[0.9rem]">
                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#999] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a] hover:decoration-[#aaa] transition-colors"
                  >
                    {artist.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {artist.website && artist.instagram && ' · '}
                {artist.instagram && (
                  <a
                    href={`https://www.instagram.com/${artist.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#999] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a] hover:decoration-[#aaa] transition-colors"
                  >
                    @{artist.instagram}
                  </a>
                )}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Community */}
      {artist.placeRelations.length > 0 && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pb-12">
          <div className="text-[0.75rem] uppercase tracking-[0.18em] text-[#999] mb-3">Community</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            {artist.placeRelations.map(rel => {
              if (rel.place.inDirectory) {
                return (
                  <Link
                    key={rel.id}
                    href={`/places/${rel.place.slug}`}
                    className="text-[0.85rem] text-[#666] underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] transition-colors"
                  >
                    {rel.place.name}
                  </Link>
                );
              }
              if (rel.place.website) {
                return (
                  <a
                    key={rel.id}
                    href={rel.place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.85rem] text-[#666] underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] transition-colors"
                  >
                    {rel.place.name}
                  </a>
                );
              }
              return (
                <span key={rel.id} className="text-[0.85rem] text-[#aaa] font-light">
                  {rel.place.name}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Artwork gallery */}
      {galleryImages.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-5 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {galleryImages.map(img => (
            <div
              key={img.id}
              className="relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-md bg-[#f4f4f0] group"
            >
              <Image
                src={img.url}
                alt={img.altText ?? ''}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>
      )}

      {citySlug && (
        <Link
          href={`/cities/${citySlug}/artists`}
          className="inline-block mx-5 sm:ml-10 my-10 text-[#888] text-[0.88rem] no-underline hover:text-[#1a1a1a] transition-colors"
        >
          ← artists
        </Link>
      )}

      <SiteFooter />

      {citySlug && <CityBottomBar citySlug={citySlug} cityDisplayName={cityDisplayName} />}
    </div>
  );
}
