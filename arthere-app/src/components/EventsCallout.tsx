import Link from 'next/link';

/**
 * Black band above the events list — same Bebas title treatment as the
 * artists page's DirectoryCallout, with an invitation for places to join.
 */
export function EventsCallout({ cityName, submitHref }: { cityName: string; submitHref: string }) {
  return (
    <div className="bg-[#1a1a1a] text-white">
      <div className="px-[18px] py-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="font-display text-[2rem] sm:text-[2.4rem] leading-none tracking-[0.04em]">
          Local art around {cityName}
        </span>
        <span className="text-[0.9rem] font-light text-white/65">
          Shows and events from places in the community. Have one?{' '}
          <Link
            href={submitHref}
            className="text-white underline underline-offset-[3px] decoration-white/40 hover:decoration-white transition-colors"
          >
            Get listed →
          </Link>
        </span>
      </div>
    </div>
  );
}
