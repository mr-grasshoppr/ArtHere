import { DEFAULT_OBJECT_POSITION } from '@/lib/focal-style';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Place, ArtistPlace, Artist, PlaceLink } from '@prisma/client';
import { NavBar } from '@/components/NavBar';
import { cityNavFor } from '@/lib/city-nav';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';
import { FadeImage } from '@/components/FadeImage';
import { Lightbox } from '@/components/Lightbox';
import { RELATIONSHIP_LABELS, linkTypeLabel } from '@/lib/artist-options';
import { EventCard } from '@/components/EventCard';
import { ScrollRow } from '@/components/ScrollRow';
import { EventCarouselTile } from '@/components/EventCarouselTile';
import type { PublicEvent } from '@/lib/event-queries';

export type PlaceWithArtists = Place & {
  artists: (ArtistPlace & { artist: Artist })[];
  links: PlaceLink[];
};

interface Props {
  place: PlaceWithArtists;
  /** When set, in-app links stay inside the /cities/<slug>/… tree. */
  citySlug?: string;
  cityDisplayName: string;
  /** url → object-position string, from auto-detected image focal points. */
  focals?: Map<string, CSSProperties>;
  /** Self-service "view my page" mode — swaps site nav/footer for a minimal
   *  bar back to the editor, so an org previewing their own page isn't one
   *  click away from browsing the rest of the site. */
  preview?: boolean;
  /** Upcoming published events at this place. */
  events?: PublicEvent[];
  /** Upcoming + past events for the bottom-of-page carousel (when showEventsCarousel is on). */
  carouselEvents?: PublicEvent[];
}

/**
 * Full place page body — shared by /places/[slug] and
 * /cities/[slug]/places/[placeSlug] so the two routes can't drift apart.
 */
export function PlaceProfilePage({ place, citySlug, cityDisplayName, focals, preview, events, carouselEvents }: Props) {
  const metaParts = [place.neighborhood].filter(Boolean) as string[];
  // Auto-detected focal point per image, falling back to center.
  const styleOf = (url: string, fallback: CSSProperties = { objectPosition: DEFAULT_OBJECT_POSITION }) =>
    focals?.get(url) ?? fallback;

  const artistHref = (slug: string) =>
    citySlug ? `/cities/${citySlug}/artists/${slug}` : `/artists/${slug}`;
  const communityHref = citySlug ? `/cities/${citySlug}/community` : null;
  const linkCls =
    'text-[#999] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a] hover:decoration-[#aaa] transition-colors';

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14">
      {preview ? (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-[#1a1a1a] text-white text-sm px-5 py-3">
          <span>Previewing your page</span>
          <Link href="/place/edit" className="underline underline-offset-2 hover:no-underline flex-shrink-0">
            ← Back to editor
          </Link>
        </div>
      ) : (
        <NavBar
          activeCitySlug={citySlug}
          theme="light"
          cityNav={citySlug ? cityNavFor(citySlug, cityDisplayName) : undefined}
        />
      )}

      {!place.inDirectory && (
        <div className="bg-[#f062a4]/10 border-b border-[#f062a4]/25 text-[#a84573] text-[0.82rem] text-center py-2 px-4">
          Preview — not yet live in the Community directory.
        </div>
      )}

      {/* Hero image — fixed 21:9 aspect (not viewport-relative height) so the
          crop framed in the admin/self-service editor, which previews the
          same 21:9 ratio, actually matches what renders here. */}
      {place.heroImageUrl && (
        <section className="relative w-full aspect-[21/9] max-h-[420px] min-h-[200px] overflow-hidden bg-[#f4f4f0]">
          <Lightbox src={place.heroImageUrl} alt={place.name} trackKind="place_photo">
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

      {/* Description + quote + links */}
      {(place.description || place.quote || place.links.length > 0) && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pt-7 pb-10">
          <div className="max-w-[680px] text-[1.05rem] text-[#444] font-light leading-[1.8]">
            {place.quote && (
              <blockquote className="italic border-l-2 border-[#ccc] pl-5 mb-[18px] text-[#888] text-[0.92rem]">
                &ldquo;{place.quote}&rdquo;
                {place.quoteAttribution && (
                  <footer className="not-italic mt-1.5 text-[#aaa]">— {place.quoteAttribution}</footer>
                )}
              </blockquote>
            )}
            {place.description && <p className="mb-[18px]">{place.description}</p>}
            {place.links.length > 0 && (
              <p className="text-[#999] text-[0.9rem]">
                {place.links.map((link, i) => (
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

      {/* Connected artists */}
      {place.artists.length > 0 && (
        <section className="max-w-[980px] mx-auto px-5 sm:px-10 pt-4 pb-10">
          <div className="text-[0.82rem] font-medium uppercase tracking-[0.18em] text-[#555] mb-8">Artists here</div>
          <div className="flex flex-wrap gap-x-6 gap-y-6 items-start">
            {place.artists.map(rel => {
              const photo = rel.artist.bioPhotoUrl ?? rel.artist.heroImageUrl;
              const relLabel =
                rel.relationship === 'OTHER' ? rel.relationshipLabel : RELATIONSHIP_LABELS[rel.relationship];
              return (
                <Link
                  key={rel.id}
                  href={artistHref(rel.artist.slug)}
                  className="group flex flex-col items-center w-[104px] text-center"
                >
                  <span className="relative block w-[84px] h-[84px] rounded-full overflow-hidden bg-[#f4f4f0]">
                    {photo && (
                      <FadeImage
                        src={photo}
                        alt={rel.artist.name}
                        fill
                        sizes="84px"
                        className="object-cover group-hover:scale-[1.05]"
                        style={styleOf(photo)}
                      />
                    )}
                  </span>
                  <span className="mt-1.5 text-[0.75rem] text-[#666] leading-snug group-hover:text-[#1a1a1a] transition-colors">
                    {rel.artist.name}
                  </span>
                  {relLabel && <span className="text-[0.68rem] text-[#bbb] font-light leading-snug">{relLabel}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {!place.showEventsCarousel && events && events.length > 0 && (
        <section className="bg-[#f7f6f3] mb-10">
          <div className="max-w-[980px] mx-auto px-5 sm:px-10 pt-4 pb-10">
            <div className="text-[0.82rem] font-medium uppercase tracking-[0.18em] text-[#555] mb-8">Upcoming happenings</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {events.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {place.galleryImages.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-5 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {place.galleryImages.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-md bg-[#f4f4f0] group"
            >
              <Lightbox src={url} alt={`${place.name} photo ${i + 1}`} trackKind="place_photo">
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

      {/* Events carousel — the very bottom of the page, opt-in per place */}
      {place.showEventsCarousel && carouselEvents && carouselEvents.length > 0 && (
        <section className="bg-[#f7f6f3]">
          <div className="max-w-[980px] mx-auto px-5 sm:px-10 pt-4 pb-10">
            <div className="text-[0.82rem] font-medium uppercase tracking-[0.18em] text-[#555] mb-8">Happenings</div>
            <ScrollRow label="happenings">
              {carouselEvents.map(e => (
                <EventCarouselTile key={e.id} event={e} />
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {!preview && communityHref && (
        <Link
          href={communityHref}
          className="inline-block mx-5 sm:ml-10 my-10 text-[#888] text-[0.88rem] no-underline hover:text-[#1a1a1a] transition-colors"
        >
          ← {cityDisplayName} Places
        </Link>
      )}

      {!preview && <SiteFooter />}
      <TechSupportLink />
    </div>
  );
}
