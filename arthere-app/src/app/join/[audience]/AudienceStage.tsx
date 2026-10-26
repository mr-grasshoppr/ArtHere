'use client';

import { useEffect, useState } from 'react';
import { getJoinAudience } from '@/lib/join-audiences';
import { AudienceStepForm } from './AudienceStepForm';

/**
 * Six-second GIF demos for each audience: a "You" pin or node appears, a cursor rolls over it and the
 * hover card opens. Mounted one at a time so each demo restarts from the top when it shows.
 */
const STAGES: Record<
  string,
  { eyebrow: string; heading: string; sub: string; slides: { id: string; label: string; src: string; position: string; mobile: string }[] }
> = {
  artists: {
    eyebrow: 'Join us · Artists',
    heading: 'Put your work on the map',
    sub: 'Art Here is a free directory of local artists and the places that show them. Tell us about you!',
    slides: [
      { id: 'network', label: 'Network', src: '/join/artists-network.gif', position: '60% 100%', mobile: '100% 100%' },
      { id: 'map', label: 'Map', src: '/join/artists-map.gif', position: '60% 50%', mobile: '80% 50%' },
    ],
  },
  organizations: {
    eyebrow: 'Join us · Partners',
    heading: 'Collaborate with us',
    sub: 'We offer storytelling, co-hosted events, a place to share happenings and calls for art, and help with grant proposals. Tell us what you have in mind!',
    slides: [
      { id: 'network', label: 'Network', src: '/join/organizations-network.gif?v=2', position: '60% 100%', mobile: '100% 100%' },
      { id: 'map', label: 'Map', src: '/join/organizations-map.gif?v=2', position: '60% 50%', mobile: '70% 50%' },
    ],
  },
  cities: {
    eyebrow: 'Join us · Cities & Neighborhoods',
    heading: 'Bring Art Here to your city',
    sub: 'Art Here launched in Portland and is growing. Tell us where we should go next, and who is ready to help.',
    slides: [{ id: 'us', label: 'Cities', src: '/join/cities-us.gif?v=2', position: '20% 50%', mobile: '70% 50%' }],
  },
};

const ROTATE_MS = 6000;

/** Join-us hero for the artists, organizations and cities pages: same stage as the places page. */
export function AudienceStage({ slug }: { slug: string }) {
  const audience = getJoinAudience(slug);
  const stage = STAGES[slug];
  const [slide, setSlide] = useState(0);
  const [picked, setPicked] = useState(false);
  const [sent, setSent] = useState(false);

  const count = stage?.slides.length ?? 0;
  useEffect(() => {
    if (count < 2 || picked || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setSlide(s => (s + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, picked]);

  if (!audience || !stage) return null;
  const current = stage.slides[slide];

  return (
    <section
      id="join-form"
      aria-labelledby="stage-heading"
      className="relative mt-14 bg-[#0b0b0b] text-white scroll-mt-14 lg:h-[max(680px,calc(100vh-56px))] lg:min-h-[680px]"
    >
      <div aria-hidden="true" className="relative h-[300px] overflow-hidden lg:absolute lg:inset-0 lg:h-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.src}
          alt=""
          width={1440}
          height={664}
          style={{ '--pm': current.mobile, '--pd': current.position } as React.CSSProperties}
          className="absolute inset-0 h-full w-full object-cover object-[var(--pm)] lg:object-[var(--pd)] animate-[stage-fade_0.7s_ease-out]"
        />
        <div className="absolute inset-0 hidden lg:block bg-[linear-gradient(90deg,rgba(11,11,11,0.92)_0%,rgba(11,11,11,0.55)_38%,rgba(11,11,11,0)_62%)]" />
      </div>

      {count > 1 && (
        <div className="absolute right-4 top-[262px] lg:top-auto lg:bottom-3 z-10 flex gap-2" role="group" aria-label="Preview">
          {stage.slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={slide === i}
              onClick={() => {
                setPicked(true);
                setSlide(i);
              }}
              className={`rounded-full px-3 py-1 text-[0.72rem] tracking-wide border transition-colors cursor-pointer ${
                slide === i ? 'bg-white text-[#1a1a1a] border-white' : 'bg-black/60 text-white/80 border-white/30 hover:border-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 mx-4 my-6 rounded-2xl border border-[#2c2c2c] bg-[rgba(20,20,20,0.94)] p-6 lg:absolute lg:left-6 lg:top-6 lg:bottom-6 lg:m-0 lg:w-[460px] lg:overflow-auto">
        {!sent && (
          <>
            <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#bdd349]">{stage.eyebrow}</p>
            <h1
              id="stage-heading"
              className="font-display text-[clamp(2.4rem,4vw,3.2rem)] leading-[0.98] tracking-[0.03em] uppercase mb-2"
            >
              {stage.heading}
            </h1>
            <p className="mb-5 text-[0.92rem] font-light text-white/65">{stage.sub}</p>
          </>
        )}
        {sent && <span id="stage-heading" className="sr-only">Join us, {audience.audience}</span>}
        <AudienceStepForm audience={audience} onSent={() => setSent(true)} />
      </div>
    </section>
  );
}
