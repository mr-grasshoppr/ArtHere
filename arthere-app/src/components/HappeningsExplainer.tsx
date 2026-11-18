'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './HappeningsExplainer.module.css';

/**
 * "What we're building" band, stacked. One row per animation, so the two clips are never side by
 * side to compare and never both in view for long. Calm motion: only the clip most on screen plays
 * (and loops); the other rests on a still. Each clip has a Play/Pause button; pausing it keeps it
 * paused. prefers-reduced-motion: nothing starts on its own.
 */
const PANELS = [
  {
    key: 'map',
    title: 'On the map',
    text: 'Slide the timeline and pins light up wherever something is on — today, this weekend, this month. Spot the neighborhoods that are buzzing and find what’s near you.',
    src: '/images/happenings-timeline-map.mp4',
    label: 'Sliding the happenings timeline on the Portland map: pins light up where something is on',
  },
  {
    key: 'network',
    title: 'In the network',
    text: 'The same timeline lights up the web of artists and places. Follow a thread from a show to the artists in it, and from them to the other places that show their work.',
    src: '/images/happenings-timeline-network.mp4',
    label: 'Sliding the happenings timeline on the network: artists and places with something on light up and connect',
  },
];

const REST_AT = 10; // a frame with the timeline open and pins/nodes lit

export function HappeningsExplainer() {
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const ratios = useRef<number[]>([0, 0]);
  const userPaused = useRef<boolean[]>([false, false]);
  const reduce = useRef(false);
  const [playing, setPlaying] = useState<number | null>(null);

  const rest = (i: number) => {
    const v = vids.current[i];
    if (v && v.readyState >= 1) v.currentTime = Math.min(REST_AT, (v.duration || REST_AT + 1) - 0.1);
  };

  // The clip most on screen (at least half visible) is the only one that plays.
  const sync = () => {
    let best = -1;
    let bestRatio = 0.5;
    ratios.current.forEach((r, i) => {
      if (r >= bestRatio && !userPaused.current[i]) { best = i; bestRatio = r; }
    });
    vids.current.forEach((v, i) => {
      if (!v) return;
      if (i === best && !reduce.current) {
        if (v.paused) v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
    setPlaying(best >= 0 && !reduce.current ? best : null);
  };

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    vids.current.forEach((v, i) => {
      if (!v) return;
      if (v.readyState >= 1) rest(i); else v.addEventListener('loadedmetadata', () => rest(i), { once: true });
    });
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { ratios.current[Number((e.target as HTMLElement).dataset.i)] = e.intersectionRatio; });
      sync();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    boxes.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (i: number) => {
    const v = vids.current[i];
    if (!v) return;
    if (v.paused) {
      vids.current.forEach((o, j) => { if (j !== i) o?.pause(); });
      userPaused.current[i] = false;
      v.play().catch(() => {});
      setPlaying(i);
    } else {
      userPaused.current[i] = true;
      v.pause();
      setPlaying(null);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.stripe} aria-hidden />
      <section className={styles.explainer} aria-labelledby="building-title">
        <div className={styles.wrap}>
          <header className={styles.head}>
            <div>
              <div className={styles.eyebrow}>What we&rsquo;re building</div>
              <h2 id="building-title" className={styles.title}>Get the 10k foot view of the local arts scene</h2>
            </div>
            <p className={styles.intro}>
              Happenings are the local art events, shows, workshops, and open studios in your area. Places that support
              local artists share what&rsquo;s happening, and we add it to the Art Here map and network graph, so art
              lovers can engage more in the local arts ecosystem.
            </p>
          </header>

          <div className={styles.panels}>
            {PANELS.map((p, i) => {
              const on = playing === i;
              return (
                <figure key={p.key} className={styles.panel}>
                  <div className={styles.media} data-kind={p.key} data-i={i} ref={el => { boxes.current[i] = el; }}>
                    <span className={styles.tag}>Sample data</span>
                    <button
                      type="button"
                      className={styles.ctl}
                      onClick={() => toggle(i)}
                      aria-label={`${on ? 'Pause' : 'Play'} animation: ${p.title}`}
                    >
                      {on ? (
                        <svg className={styles.ico} viewBox="0 0 10 10" aria-hidden><rect x="1" y="1" width="3" height="8" fill="currentColor" /><rect x="6" y="1" width="3" height="8" fill="currentColor" /></svg>
                      ) : (
                        <svg className={styles.ico} viewBox="0 0 10 10" aria-hidden><path d="M2 1 9 5 2 9z" fill="currentColor" /></svg>
                      )}
                      {on ? 'Pause' : 'Play'}
                    </button>
                    <video
                      ref={el => { vids.current[i] = el; }}
                      src={p.src}
                      aria-label={p.label}
                      muted loop playsInline preload="metadata"
                      onClick={() => toggle(i)}
                    />
                  </div>
                  <figcaption className={styles.cap}>
                    <h3 className={styles.capTitle}>{p.title}</h3>
                    <p className={styles.capText}>{p.text}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <div className={styles.foot}>
            <span className={styles.dot} aria-hidden />
            <p>
              <strong>Note:</strong> The above animations use sample data to demonstrate this feature. Map and network
              will be live as partners onboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
