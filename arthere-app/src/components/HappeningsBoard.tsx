'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface BoardEvent {
  id: string;
  name: string;
  /** Site-timezone calendar days, "YYYY-MM-DD". */
  startDay: string;
  endDay: string;
  /** "7:00 PM", or "" for all-day. */
  time: string;
  /** "Through Sun, Nov 8" for multi-day events, else "". */
  through: string;
  placeName: string;
  href: string;
  external: boolean;
  price: string | null;
  audience: string | null;
  past: boolean;
  coverUrl: string;
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dayNum = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, dd) / 86400000);
};
const dateOf = (n: number) => new Date(n * 86400000);
const isFamily = (e: BoardEvent) => /all ages|kid|famil|teen/i.test(e.audience ?? '');

function Row({ e }: { e: BoardEvent }) {
  const d = dateOf(dayNum(e.startDay));
  // Price, then who it's for — "All ages", kids and family audiences read as "Family friendly".
  const tags = [e.price, isFamily(e) ? 'Family friendly' : e.audience].filter((t): t is string => !!t);
  const title = (
    <span className="font-heading text-[1.3rem] sm:text-[1.7rem] font-extrabold leading-[1.1] tracking-[-0.01em] hover:underline underline-offset-4 decoration-2">
      {e.name}
    </span>
  );
  const image = (
    <span className="relative block w-[6.5rem] sm:w-[11rem] aspect-[4/3] rounded-lg overflow-hidden bg-[#e8e8e4]">
      <Image src={e.coverUrl} alt="" fill sizes="(max-width: 640px) 104px, 176px" className="object-cover" />
    </span>
  );
  const link = (children: React.ReactNode, className?: string) =>
    e.external ? (
      <a href={e.href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    ) : (
      <Link href={e.href} className={className}>{children}</Link>
    );
  return (
    <li className={`flex items-center gap-3 sm:gap-6 py-5 border-b border-[#e6e3dd] ${e.past ? 'opacity-75' : ''}`}>
      <div className="flex flex-col items-start w-[3.2rem] sm:w-[4.6rem] shrink-0">
        <span className="font-display text-[2.6rem] sm:text-[3.4rem] leading-[0.9]">{d.getUTCDate()}</span>
        <span className="mt-1 text-[0.62rem] uppercase tracking-[0.1em] leading-tight">
          <span className="text-[#f96a9b]">{WD[d.getUTCDay()]}</span> <span className="text-[#888]">{MON[d.getUTCMonth()]}</span>
        </span>
      </div>
      {link(image, 'shrink-0')}
      <div className="min-w-0 flex-1">
        {link(title)}
        <p className="text-[0.88rem] text-[#777] mt-1">
          {e.placeName}
          {e.time && ` · ${e.time}`}
          {e.through && ` · ${e.through}`}
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(t => (
              <span key={t} className="px-3 py-0.5 rounded-full border border-[#1a1a1a]/30 text-[0.72rem] text-[#444]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The happenings page body: a chartreuse timeline bar (when / what chips and a
 * day histogram built from the real events), the agenda, and a small preview of
 * the map and network. Everything shown comes from the published events.
 */
export function HappeningsBoard({
  events,
  submitHref,
}: {
  events: BoardEvent[];
  submitHref: string;
}) {
  const upcoming = events.filter(e => !e.past);
  const past = events.filter(e => e.past);

  return (
    <>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-8 pb-16">
        <main>
          {past.length > 0 && (
            <section>
              <div className="text-[0.78rem] font-medium uppercase tracking-[0.18em] text-[#555]">Recent happenings</div>
              <ul className="mt-2">
                {past.map(e => <Row key={e.id} e={e} />)}
              </ul>
            </section>
          )}

          <section className={past.length > 0 ? 'mt-10' : ''}>
            <div className="text-[0.78rem] font-medium uppercase tracking-[0.18em] text-[#555]">Upcoming</div>
            {upcoming.length > 0 && (
              <ul className="mt-2">
                {upcoming.map(e => <Row key={e.id} e={e} />)}
              </ul>
            )}
            <p className="mt-3 text-[0.95rem] text-[#555]">
              <strong className="font-semibold text-[#1a1a1a]">More to come!</strong> Community places are adding shows,
              openings and workshops every day.{' '}
              <Link href={submitHref} className="underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] whitespace-nowrap">
                Get your happening listed →
              </Link>
            </p>
          </section>
        </main>

      </div>
    </>
  );
}
