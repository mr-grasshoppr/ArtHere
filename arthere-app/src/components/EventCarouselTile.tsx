import { FadeImage } from '@/components/FadeImage';
import { eventCoverUrl } from '@/lib/event-cover-fallback';
import { formatEventWhen, isUpcoming } from '@/lib/events';
import type { PublicEvent } from '@/lib/event-queries';

/**
 * One tile in a place page's events carousel: an elongated rectangle with a
 * small photo on the left and the text on the right. The date stays on one
 * line, hence the minimum width.
 */
export function EventCarouselTile({ event: e }: { event: PublicEvent }) {
  const past = !isUpcoming(e);
  const tile = (
    <div className="flex items-stretch gap-4 rounded-2xl border border-[#dedad4] bg-white overflow-hidden h-[7rem]">
      <div className="relative w-[6.5rem] shrink-0 bg-[#e8e8e4]">
        <FadeImage
          src={eventCoverUrl(e)}
          alt={e.name}
          fill
          sizes="104px"
          className={`object-cover ${past ? 'opacity-90' : ''}`}
        />
      </div>
      <div className="min-w-0 flex-1 py-3 pr-4 flex flex-col justify-center">
        {past && <p className="text-[0.72rem] italic text-[#aaa] mb-0.5">Past event</p>}
        <p className="whitespace-nowrap text-[0.68rem] uppercase tracking-[0.06em] text-[#333]">{formatEventWhen(e)}</p>
        <p className="mt-1 text-[0.95rem] font-semibold leading-snug text-[#1a1a1a] line-clamp-3">{e.name}</p>
      </div>
    </div>
  );

  const cls = 'shrink-0 min-w-[370px] w-[90%] sm:w-[calc((100%-1.25rem)/2)] block';
  return e.linkUrl ? (
    <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" className={`${cls} hover:opacity-90 transition-opacity`}>
      {tile}
    </a>
  ) : (
    <div className={cls}>{tile}</div>
  );
}
