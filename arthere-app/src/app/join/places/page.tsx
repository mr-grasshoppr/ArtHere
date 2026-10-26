import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { SUPPORT_CRITERIA } from '@/lib/place-intake';
import { PlacesStage } from './PlacesStage';

export const metadata: Metadata = {
  title: 'Join us | Art Here',
  description: 'We spotlight the places that invest in local artists.',
  alternates: { canonical: '/join/places' },
};

const STEPS = ['Express interest here', 'Complete your page', 'Tell us when you have an event or project'];

const BENEFITS = [
  { title: 'Get discovered', body: 'Appear on our interactive map and creative network graph.' },
  { title: 'Connect with audiences', body: 'Link directly to affiliated artist profiles to drive foot traffic.' },
  { title: 'Post events', body: 'Publish openings, pop-ups, and shows directly to the arts calendar.' },
];

const HEADING = 'font-display text-[1.7rem] sm:text-[2rem] leading-none tracking-[0.02em] uppercase mb-4';
const BODY = 'text-[1.05rem] text-[#1a1a1a] leading-[1.6]';

export default function PlacesLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />

      <main>
        <PlacesStage />

        <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-12 sm:py-16 flex flex-col gap-14 sm:gap-16">
          <section aria-labelledby="why-heading">
            <h2 id="why-heading" className={HEADING}>Why join</h2>
            <p className={`${BODY} max-w-[640px]`}>
              Connect to the artists you champion, put your space on the map, and share your events.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {BENEFITS.map(b => (
                <div key={b.title} className="rounded-2xl border border-[#dedad4] p-5">
                  <h3 className="font-heading text-[1.1rem] font-bold tracking-[-0.02em] mb-1.5">{b.title}</h3>
                  <p className="m-0 text-[0.95rem] text-[#555] font-light leading-[1.7]">{b.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="how-heading">
            <h2 id="how-heading" className={HEADING}>How it works</h2>
            <ol className="grid gap-4 sm:grid-cols-3 list-none p-0 m-0">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-white font-display text-[1.4rem] leading-none"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[1rem] leading-[1.4]">{s}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="criteria-heading">
            <h2 id="criteria-heading" className={HEADING}>Criteria</h2>
            <p className={`${BODY} italic mb-4 max-w-[720px]`}>
              To ensure we spotlight active patrons of the arts, participating spaces support local creatives through at least one of the following:
            </p>
            <ol className={`${BODY} italic list-decimal pl-5 flex flex-col gap-3 m-0 max-w-[720px]`}>
              {SUPPORT_CRITERIA.map(c => (
                <li key={c.id}>{c.title}</li>
              ))}
            </ol>
          </section>
        </div>
      </main>

      <SiteFooter dark />
    </div>
  );
}
