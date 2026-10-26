'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlacesIntakeForm, type IntakeStatus } from './PlacesIntakeForm';

/**
 * Each GIF is a six-second demo: a "Your Place" pin or node appears, a cursor rolls over it and the
 * hover card opens. They are mounted one at a time so the demo restarts from the top every time it shows.
 */
const SLIDES = [
  { id: 'map', label: 'Map', src: '/places/map-demo-2.gif', objectPosition: '60% 50%' },
  { id: 'network', label: 'Network', src: '/places/network-demo-2.gif', objectPosition: '60% 100%' },
] as const;

const ROTATE_MS = 6000;

/**
 * Join-us hero: a dark stage that alternates between the map and the network graph, each showing a
 * place being rolled over, with the three-step form floating over it.
 */
export function PlacesStage() {
  const [slide, setSlide] = useState(0);
  const [picked, setPicked] = useState(false); // once they choose a view, stop rotating
  const [status, setStatus] = useState<IntakeStatus>('idle');

  const onStatus = useCallback((s: IntakeStatus) => setStatus(s), []);

  useEffect(() => {
    if (picked || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [picked]);

  const sent = status === 'sent';
  const current = SLIDES[slide];

  return (
    <section
      id="space-form"
      aria-labelledby="stage-heading"
      className="relative mt-14 bg-[#0b0b0b] text-white scroll-mt-14 lg:h-[max(640px,calc(100vh-56px))] lg:min-h-[640px]"
    >
      {/* Backdrop. Decorative; the form carries the content. */}
      <div aria-hidden="true" className="relative h-[300px] overflow-hidden lg:absolute lg:inset-0 lg:h-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.src}
          alt=""
          width={1440}
          height={664}
          style={{ objectPosition: current.objectPosition }}
          className="absolute inset-0 h-full w-full object-cover animate-[stage-fade_0.7s_ease-out]"
        />
        <div className="absolute inset-0 hidden lg:block bg-[linear-gradient(90deg,rgba(11,11,11,0.92)_0%,rgba(11,11,11,0.55)_38%,rgba(11,11,11,0)_62%)]" />
      </div>

      {/* Slide picker */}
      <div className="absolute right-4 top-[262px] lg:top-auto lg:bottom-3 z-10 flex gap-2" role="group" aria-label="Preview">
        {SLIDES.map((s, i) => (
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

      <div className="relative z-10 mx-4 my-6 rounded-2xl border border-[#2c2c2c] bg-[rgba(20,20,20,0.94)] p-6 lg:absolute lg:left-6 lg:top-6 lg:bottom-6 lg:m-0 lg:w-[460px] lg:overflow-auto">
        {!sent && (
          <>
            <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#bdd349]">Join us · Places</p>
            <h1
              id="stage-heading"
              className="font-display text-[clamp(2.4rem,4vw,3.2rem)] leading-[0.98] tracking-[0.03em] uppercase mb-2"
            >
              Put your place on the map
            </h1>
            <p className="mb-5 text-[0.92rem] font-light text-white/65">
              We spotlight the places that invest in local artists. Tell us about yours!
            </p>
          </>
        )}
        {sent && <span id="stage-heading" className="sr-only">Join us, places</span>}
        <PlacesIntakeForm onStatus={onStatus} />
      </div>
    </section>
  );
}
