import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Place, ArtistPlace, Artist, PlaceRelationship } from '@prisma/client';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';
import { FadeImage } from '@/components/FadeImage';
import { Lightbox } from '@/components/Lightbox';

const RELATIONSHIP_LABELS: Record<PlaceRelationship, string> = {
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
  GRANTEE: 'Grantee',
  EXHIBITING_ARTIST: 'Exhibiting Artist',
  MEMBER: 'Member',
  IN_SHOP: '',
  OTHER: '',
};

export type PlaceWithArtists = Place & {
  artists: (ArtistPlace & { artist: Artist })[];
};

interface Props {
  place: PlaceWithArtists;
  /** When set, in-app links stay inside the /cities/<slug>/… tree. */
  citySlug?: string;
  cityDisplayName: string;
  /** url → object-position string, from auto-detected image focal points. */
  focals?: Map<string, CSSProperties>;
}

/**
 * Full place page body — shared by /places/[slug] and
 * /cities/[slug]/places/[placeSlug] so the two routes can't drift apart.
 */
export function PlaceProfilePage({ place, citySlug, cityDisplayName, focals }: Props) {
  const metaParts = [place.neighborhood].filter(Boolean) as string[];
  // Auto-detected focal point per image, falling back to center.
  const styleOf = (url: string, fallback: CSSProperties = { objectPosition: '50% 50%' }) =>
    focals?.get(url) ?? fallback;

  const artistHref = (slug: string) =>
    citySlug ? `/cities/${citySlug}/artists/${slug}` : `/artists/${slug}`;
  const communityHref = citySlug ? `/cities/${citySlug}/community` : null;

  return (
    <div className="min-h-full bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar activeCitySlug={citySlug} theme="light" />

      {/* Hero image — fixed 21:9 aspect (not viewport-relative height) so the
          crop framed in the admin/self-service editor, which previews the
          same 21:9 ratio, actually matches what renders here. */}
      {place.heroImageUrl && (
        <section className="relative w-full aspect-[21/9] max-h-[420px] min-h-[200px] overflow-hidden bg-[#f4f4f0]">
          <Lightbox src={place.heroImageUrl} alt={place.name}>
            <FadeImage
              src={place.heroImageUrl}
              alt={place.name}
              fill
              sizes="100vw"
              className="object-cover"
              style={styleOf(place.heroImageUrl, { objectPosition: '50% 38%' })}
              priority
            />
          </Lightbox>
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

      {/* Description + quote + website */}
      {(place.description || place.quote || place.website) && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pt-7 pb-10">
          <div className="max-w-[680px] text-[1.05rem] text-[#444] font-light leading-[1.8]">
            {place.description && <p className="mb-[18px]">{place.description}</p>}
            {place.quote && (
              <blockquote className="italic border-l-2 border-[#ccc] pl-5 mb-[18px] text-[#888] text-[0.92rem]">
                &ldquo;{place.quote}&rdquo;
                {place.quoteAttribution && (
                  <footer className="not-italic mt-1.5 text-[#aaa]">— {place.quoteAttribution}</footer>
                )}
              </blockquote>
            )}
            {place.website && (
              <p className="text-[#999] text-[0.9rem]">
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#999] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a] hover:decoration-[#aaa] transition-colors"
                >
                  {place.websiteLabel ?? place.website.replace(/^https?:\/\//, '')}
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
            {place.artists.map(rel => {
              const relLabel =
                rel.relationship === 'OTHER' ? rel.relationshipLabel : RELATIONSHIP_LABELS[rel.relationship];
              return (
                <div key={rel.id} className="text-[0.85rem]">
                  <Link
                    href={artistHref(rel.artist.slug)}
                    className="text-[#666] underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] transition-colors"
                  >
                    {rel.artist.name}
                  </Link>
                  {relLabel && <span className="text-[#bbb] font-light"> · {relLabel}</span>}
                </div>
              );
            })}
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
              <Lightbox src={url} alt={`${place.name} photo ${i + 1}`}>
                <FadeImage
                  src={url}
                  alt={`${place.name} photo ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover group-hover:scale-[1.03]"
                  style={styleOf(url)}
                />
              </Lightbox>
            </div>
          ))}
        </div>
      )}

      {communityHref && (
        <Link
          href={communityHref}
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
