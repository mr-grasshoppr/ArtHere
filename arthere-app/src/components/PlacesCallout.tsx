import Link from 'next/link';

/**
 * Black band above the places grid — same Bebas title treatment as the
 * artists and events pages, with an invitation for supporters to join.
 */
export function PlacesCallout() {
  return (
    <div className="bg-[#1a1a1a] text-white">
      <div className="px-[18px] py-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="font-display text-[2rem] sm:text-[2.4rem] leading-none tracking-[0.04em]">
          Local artist supporters
        </span>
        <span className="text-[0.9rem] font-light text-white/65">
          Art Here is growing. Support local artists?{' '}
          <Link
            href="/join/places"
            className="text-white underline underline-offset-[3px] decoration-white/40 hover:decoration-white transition-colors"
          >
            Get featured →
          </Link>
        </span>
      </div>
    </div>
  );
}
