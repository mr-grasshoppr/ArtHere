import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import Link from 'next/link';
import { SUPPORT_CRITERIA } from '@/lib/place-intake';
import { JOIN_AUDIENCES, getJoinAudience } from '@/lib/join-audiences';
import { JOIN_ACCENTS } from '@/lib/join-accent';
import { PlacesStage } from './PlacesStage';

export const metadata: Metadata = {
  title: 'Join us | Art Here',
  description: 'We spotlight the places that invest in local artists.',
  alternates: { canonical: '/join/places' },
};

const BENEFITS = [
  { title: 'Get discovered', body: 'Appear on our interactive map and creative network graph.' },
  { title: 'Connect with audiences', body: 'Link directly to affiliated artist profiles to drive foot traffic.' },
  { title: 'Post events', body: 'Publish openings, pop-ups, and shows directly to the arts calendar.' },
];

// One title style (Bebas), hairline rules, one left edge. The audience accent
// is set here because --accent only exists inside PlacesStage.
const HEADING = 'font-display text-[1.4rem] tracking-[0.06em] uppercase mt-12 mb-4';
const RULE = 'border-t border-[#d9d6cf]';

export default function PlacesLandingPage() {
  const a = getJoinAudience('places')!;
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />

      <PlacesStage />

      <main
        className="max-w-[1000px] mx-auto px-6 sm:px-10 py-12 sm:py-16"
        style={{ '--accent': JOIN_ACCENTS.places.color } as React.CSSProperties}
      >
        <p className="text-[1.1rem] text-[#444] font-light leading-[1.8] max-w-[720px]">{a.intro}</p>

        <h2 id="why-heading" className={HEADING}>Why join</h2>
        <ul aria-labelledby="why-heading" className={`${RULE} list-none p-0 m-0 grid md:grid-cols-3 md:gap-x-10`}>
          {BENEFITS.map(b => (
            <li key={b.title} className="pt-4 pb-5">
              <h3 className="font-display text-[1.1rem] tracking-[0.06em] uppercase m-0 mb-1.5">{b.title}</h3>
              <p className="m-0 text-[0.95rem] text-[#555] font-light leading-[1.7]">{b.body}</p>
            </li>
          ))}
        </ul>

        <h2 id="expect-heading" className={HEADING}>What to expect</h2>
        <ol aria-labelledby="expect-heading" className={`${RULE} list-none p-0 m-0 max-w-[720px]`}>
          {a.expect.map((step, i) => (
            <li key={step} className="flex gap-4 py-4 border-b border-[#d9d6cf]">
              <span className="font-display text-[1.6rem] leading-none w-6 shrink-0 text-[color:var(--accent)]">{i + 1}</span>
              <span className="text-[0.95rem] text-[#555] font-light leading-[1.7] pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-[0.85rem] text-[#999]">
          Not the right fit? See the other ways to join:{' '}
          {JOIN_AUDIENCES.filter(o => o.slug !== a.slug).map((o, i, arr) => (
            <span key={o.slug}>
              <Link href={`/join/${o.slug}`} className="underline underline-offset-[3px] decoration-[#ccc] hover:text-[#1a1a1a] transition-colors">
                {o.audience}
              </Link>
              {i < arr.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>

        {/* Fine print: who qualifies as a participating place. */}
        <section aria-labelledby="criteria-heading" className="mt-12 pt-6 border-t border-[#ebe8e2] max-w-[720px]">
          <h2 id="criteria-heading" className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#999]">Criteria</h2>
          <p className="m-0 mb-2 text-[0.78rem] text-[#999] font-light leading-[1.6]">
            To ensure we spotlight active patrons of the arts, participating spaces support local creatives through at least one of the following:
          </p>
          <ol className="list-decimal pl-4 m-0 flex flex-col gap-1 text-[0.78rem] text-[#999] font-light leading-[1.6]">
            {SUPPORT_CRITERIA.map(c => (
              <li key={c.id}>{c.title}</li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
