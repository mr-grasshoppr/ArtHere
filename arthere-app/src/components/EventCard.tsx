import Link from 'next/link';
import Image from 'next/image';
import { eventCoverUrl } from '@/lib/event-cover-fallback';
import { formatEventWhen } from '@/lib/events';
import { isCityLevelNeighborhood, parseNeighborhoodList } from '@/lib/neighborhoods';
import type { PublicEvent } from '@/lib/event-queries';

/** One event, used on org pages (showPlace=false) and the /events listing. */
export function EventCard({ event, showPlace = false, citySlug }: { event: PublicEvent; showPlace?: boolean; citySlug?: string }) {
  const neighborhoods = parseNeighborhoodList(event.place.neighborhood).filter(n => !isCityLevelNeighborhood(n));
  // "7688 SW Capitol Hwy, Portland, OR 97219" -> street line only.
  const address = event.place.locations[0]?.streetAddress.split(',')[0].trim();
  const artists = event.artists.map((a) => a.artist).filter((a) => !a.isArchived && !a.isPlaceholder);
  return (
    <article className="flex flex-col h-full rounded-2xl border border-[#dedad4] bg-white overflow-hidden">
      <div className="relative w-full aspect-[16/9] lg:aspect-[2/1] overflow-hidden bg-[#e8e8e4]">
        <Image src={eventCoverUrl(event)} alt={event.name} fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
      </div>
      <div className="px-5 py-5 flex flex-col flex-1">
      {neighborhoods.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {neighborhoods.map(n => (
            <span key={n} className="px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-white text-[0.7rem] font-medium tracking-wide">{n}</span>
          ))}
        </div>
      )}
      <p className="whitespace-nowrap text-[0.7rem] lg:text-[0.75rem] uppercase tracking-[0.05em] lg:tracking-[0.12em] text-[#999]">{formatEventWhen(event)}</p>
      <h3 className="text-[1.05rem] font-medium mt-1">{event.name}</h3>
      {showPlace && (
        <div className="mt-0.5">
          <Link href={citySlug ? `/cities/${citySlug}/places/${event.place.slug}` : `/places/${event.place.slug}`} className="text-[0.85rem] text-[#777] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a]">
            {event.place.name}
          </Link>
          {address && <p className="text-[0.8rem] text-[#999]">{address}</p>}
        </div>
      )}
      {(event.price || event.audience) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[event.price, event.audience].filter((t): t is string => !!t).map(t => (
            <span key={t} className="px-2.5 py-0.5 rounded-full border border-[#1a1a1a]/25 text-[#444] text-[0.7rem] font-medium tracking-wide">{t}</span>
          ))}
        </div>
      )}
      {event.description && <p className="text-[0.88rem] text-[#666] mt-2 whitespace-pre-line">{event.description}</p>}
      {event.linkUrl && (
        <a href={event.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[0.85rem] mt-2 underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] w-fit">
          Learn more →
        </a>
      )}
      {artists.length > 0 && (
        <p className="text-[0.82rem] text-[#888] mt-2">
          With{' '}
          {artists.map((a, i) => (
            <span key={a.slug}>
              {i > 0 && ', '}
              <Link href={citySlug ? `/cities/${citySlug}/artists/${a.slug}` : `/artists/${a.slug}`} className="underline underline-offset-4 decoration-[#ccc] hover:text-[#1a1a1a]">{a.name}</Link>
            </span>
          ))}
        </p>
      )}
      </div>
    </article>
  );
}
