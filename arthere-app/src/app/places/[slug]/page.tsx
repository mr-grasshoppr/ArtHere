import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { PlaceRelationship } from '@prisma/client';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';

const RELATIONSHIP_LABELS: Record<PlaceRelationship, string> = {
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
  GRANTEE: 'Grantee',
  EXHIBITING_ARTIST: 'Exhibiting Artist',
  MEMBER: 'Member',
  IN_SHOP: '',
};

export async function generateStaticParams() {
  const places = await prisma.place.findMany({ where: { inDirectory: true }, select: { slug: true } });
  return places.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await prisma.place.findUnique({ where: { slug }, select: { name: true } });
  return { title: place ? `${place.name} — Art Here` : 'Art Here' };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      artists: {
        orderBy: { createdAt: 'asc' },
        include: { artist: { include: { city: true } } },
      },
    },
  });

  if (!place || !place.inDirectory) notFound();

  // Derive the city to link back to from the first connected artist that has
  // one — places themselves aren't tied to a city directly.
  const cityForPlace = place.artists.find(rel => rel.artist.city)?.artist.city ?? null;
  const citySlug = cityForPlace?.slug;
  const cityDisplayName = cityForPlace
    ? cityForPlace.displayName ?? `${cityForPlace.name}${cityForPlace.state ? `, ${cityForPlace.state}` : ''}`
    : '';

  const metaParts = [place.neighborhood].filter(Boolean) as string[];

  return (
    <div className="min-h-full bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar activeCitySlug={citySlug} theme="light" />

      {/* Hero image */}
      {place.heroImageUrl && (
        <section className="relative w-full h-[38vh] min-h-[260px] overflow-hidden bg-[#f4f4f0]">
          <Image
            src={place.heroImageUrl}
            alt={place.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </section>
      )}

      {/* Identity block */}
      <div className="max-w-[980px] mx-auto px-5 sm:px-10 pt-10">
        <h1 className="font-heading text-[1.35rem] sm:text-[1.6rem] font-bold tracking-[-0.01em] leading-tight mb-1.5">
          {place.name}
        </h1>
        {metaParts.length > 0 && (
          <div className="text-[0.88rem] text-[#888] font-light">{metaParts.join(' · ')}</div>
        )}
      </div>

      {/* Description + website */}
      {(place.description || place.website) && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pt-7 pb-10">
          <div className="max-w-[680px] text-[1.05rem] text-[#444] font-light leading-[1.8]">
            {place.description && <p className="mb-[18px]">{place.description}</p>}
            {place.website && (
              <p className="text-[#999] text-[0.9rem]">
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#999] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a] hover:decoration-[#aaa] transition-colors"
                >
                  {place.website.replace(/^https?:\/\//, '')}
                </a>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Connected artists */}
      {place.artists.length > 0 && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pb-12">
          <div className="text-[0.75rem] uppercase tracking-[0.18em] text-[#999] mb-3">Artists here</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            {place.artists.map(rel => (
              <div key={rel.id} className="text-[0.85rem]">
                <Link
                  href={`/artists/${rel.artist.slug}`}
                  className="text-[#666] underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] transition-colors"
                >
                  {rel.artist.name}
                </Link>
                {RELATIONSHIP_LABELS[rel.relationship] && (
                  <span className="text-[#bbb] font-light"> · {RELATIONSHIP_LABELS[rel.relationship]}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {place.galleryImages.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-5 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {place.galleryImages.map((url, i) => (
            <div
              key={url}
              className="relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-md bg-[#f4f4f0] group"
            >
              <Image
                src={url}
                alt={`${place.name} photo ${i + 1}`}
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
          href={`/cities/${citySlug}/community`}
          className="inline-block mx-5 sm:ml-10 my-10 text-[#888] text-[0.88rem] no-underline hover:text-[#1a1a1a] transition-colors"
        >
          ← {cityDisplayName} Community
        </Link>
      )}

      <SiteFooter />
      <TechSupportLink />

      {citySlug && <CityBottomBar citySlug={citySlug} cityDisplayName={cityDisplayName} />}
    </div>
  );
}
