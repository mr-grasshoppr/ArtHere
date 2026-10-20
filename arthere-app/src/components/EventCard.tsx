import Link from 'next/link';
import Image from 'next/image';
import { formatEventWhen } from '@/lib/events';
import type { PublicEvent } from '@/lib/event-queries';

/** One event, used on org pages (showPlace=false) and the /events listing. */
export function EventCard({ event, showPlace = false, citySlug }: { event: PublicEvent; showPlace?: boolean; citySlug?: string }) {
  const artists = event.artists.map((a) => a.artist).filter((a) => !a.isArchived && !a.isPlaceholder);
  return (
    <article className="flex flex-col">
      {event.coverImageUrl && (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-md bg-[#f4f4f0] mb-3">
          <Image src={event.coverImageUrl} alt={event.name} fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
        </div>
      )}
      <p className="text-[0.75rem] uppercase tracking-[0.14em] text-[#999]">{formatEventWhen(event)}</p>
      <h3 className="text-[1.05rem] font-medium mt-1">{event.name}</h3>
      {showPlace && (
        <Link href={citySlug ? `/cities/${citySlug}/places/${event.place.slug}` : `/places/${event.place.slug}`} className="text-[0.85rem] text-[#777] underline underline-offset-4 decoration-[#ddd] hover:text-[#1a1a1a]">
          {event.place.name}
        </Link>
      )}
      {event.description && <p className="text-[0.88rem] text-[#666] mt-2 whitespace-pre-line">{event.description}</p>}
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
    </article>
  );
}
