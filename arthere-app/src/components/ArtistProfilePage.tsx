import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Artist, ArtworkImage, ArtistPlace, ArtistLink, Place, City } from '@prisma/client';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';
import { FadeImage } from '@/components/FadeImage';
import { Lightbox } from '@/components/Lightbox';
import { linkTypeLabel } from '@/lib/artist-options';

export type ArtistWithProfile = Artist & {
  artworkImages: ArtworkImage[];
  placeRelations: (ArtistPlace & { place: Place | null })[];
  links: ArtistLink[];
  city: City | null;
};

export function cityLabel(city: Pick<City, 'name' | 'state' | 'displayName'> | null): string {
  if (!city) return '';
  return city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;
}

interface Props {
  artist: ArtistWithProfile;
  /** When set, in-app links stay inside the /cities/<slug>/… tree. */
  citySlug?: string;
  cityDisplayName: string;
  /** url → object-position string, from auto-detected image focal points. */
  focals?: Map<string, CSSProperties>;
}

/**
 * Full artist profile page body — shared by /artists/[slug] and
 * /cities/[slug]/artists/[artistSlug] so the two routes can't drift apart.
 */
export function ArtistProfilePage({ artist, citySlug, cityDisplayName, focals }: Props) {
  const styleOf = (url: string, fallback: CSSProperties = { objectPosition: '50% 50%' }) =>
    focals?.get(url) ?? fallback;
  const heroUrl =
    artist.heroImageUrl ??
    artist.artworkImages.find(img => img.isHero)?.url ??
    artist.artworkImages[0]?.url ??
    null;

  const galleryImages = artist.artworkImages
    .filter(img => !img.isHero && img.url !== artist.heroImageUrl)
    .slice(0, 3);

  const metaParts = [
    artist.medium,
    artist.neighborhood !== cityDisplayName ? artist.neighborhood : null,
    cityDisplayName,
  ].filter(Boolean);

  const isQuoteParagraph = (p: string) => /^["“]/.test(p) && /["”]$/.test(p);
  const bioParagraphsRaw = (artist.bio ?? '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
  // Pull quotes render above the rest of the bio regardless of where they
  // fall in the original text.
  const bioParagraphs = [
    ...bioParagraphsRaw.filter(isQuoteParagraph),
    ...bioParagraphsRaw.filter(p => !isQuoteParagraph(p)),
  ];

  const placeHref = (slug: string) =>
    citySlug ? `/cities/${citySlug}/places/${slug}` : `/places/${slug}`;
  const artistsHref = citySlug ? `/cities/${citySlug}/artists` : null;

  const linkCls =
    'text-[#999] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a] hover:decoration-[#aaa] transition-colors';

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar activeCitySlug={citySlug ?? artist.city?.slug} theme="light" />

      {artist.isPlaceholder && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-center text-[0.8rem] text-amber-700">
          This is a prototype profile. The artist has not yet set up their own page.
        </div>
      )}

      {/* Hero image — fixed 21:9 aspect (not viewport-relative height) so the
          crop framed in the admin editor, which previews the same 21:9
          ratio, actually matches what renders here. */}
      {heroUrl && (
        <section className="relative w-full aspect-[21/9] max-h-[420px] min-h-[200px] overflow-hidden bg-[#f4f4f0]">
          <Lightbox src={heroUrl} alt={`${artist.name} artwork`}>
            <FadeImage
              src={heroUrl}
              alt={`${artist.name} artwork`}
              fill
              sizes="100vw"
              className="object-cover"
              style={styleOf(heroUrl)}
              priority
            />
          </Lightbox>
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
              <FadeImage
                src={artist.bioPhotoUrl}
                alt={artist.name}
                fill
                sizes="140px"
                className="object-cover"
                style={styleOf(artist.bioPhotoUrl, { objectPosition: '50% 20%' })}
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
      {(bioParagraphs.length > 0 || artist.links.length > 0) && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pt-7 pb-10">
          <div className="max-w-[680px] text-[1.05rem] text-[#444] font-light leading-[1.8]">
            {bioParagraphs.map((p, i) => {
              if (isQuoteParagraph(p)) {
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
            {artist.links.length > 0 && (
              <p className="text-[#999] text-[0.9rem]">
                {artist.links.map((link, i) => (
                  <span key={link.id}>
                    {i > 0 && ' · '}
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      {link.label ?? linkTypeLabel(link.type)}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Places */}
      {artist.placeRelations.length > 0 && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pb-12">
          <div className="text-[0.75rem] uppercase tracking-[0.18em] text-[#999] mb-3">Places</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            {artist.placeRelations.map(rel => {
              // A relation is either a real page (rel.place) or a free-text
              // venue with no page (rel.venueName). Only venues with a live
              // directory page link; everything else is plain text.
              const name = rel.place?.name ?? rel.venueName;
              if (!name) return null;
              if (rel.place?.inDirectory) {
                return (
                  <Link
                    key={rel.id}
                    href={placeHref(rel.place.slug)}
                    className="text-[0.85rem] text-[#666] underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] transition-colors"
                  >
                    {name}
                  </Link>
                );
              }
              return (
                <span key={rel.id} className="text-[0.85rem] text-[#aaa] font-light">
                  {name}
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
              <Lightbox src={img.url} alt={img.altText ?? ''}>
                <FadeImage
                  src={img.url}
                  alt={img.altText ?? ''}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover group-hover:scale-[1.03]"
                  style={styleOf(img.url)}
                />
              </Lightbox>
            </div>
          ))}
        </div>
      )}

      {artistsHref && (
        <Link
          href={artistsHref}
          className="inline-block mx-5 sm:ml-10 my-10 text-[#888] text-[0.88rem] no-underline hover:text-[#1a1a1a] transition-colors"
        >
          ← artists
        </Link>
      )}

      <SiteFooter />
      <TechSupportLink />

      {citySlug && <CityBottomBar citySlug={citySlug} cityDisplayName={cityDisplayName} />}
    </div>
  );
}
