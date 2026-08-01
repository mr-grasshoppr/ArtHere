import styles from './AnimatedLogoMask.module.css';

// Approved for this treatment — confirm with an artist before adding more.
// Each file already has soft feathered edges and the artist's name baked in
// bottom-right (see scripts/build-logo-mask-slides.mjs for how they were made).
const SLIDES = [
  '/images/mask-slide-kurtis.png',
  '/images/mask-slide-kristin1.png',
  '/images/mask-slide-kristin2.png',
];

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
}

export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '' }: Props) {
  // Two back-to-back copies of the same three slides — translateX(-50%)
  // lands exactly back on the start, so the loop is seamless and motion
  // never stops, pauses, or resets to black mid-cycle.
  const track = [...SLIDES, ...SLIDES];

  return (
    <div className={`${styles.mask} ${className}`} style={{ width }}>
      <div className={styles.track}>
        {track.map((src, i) => (
          <div key={i} className={styles.slide} style={{ width, backgroundImage: `url(${src})` }} />
        ))}
      </div>
    </div>
  );
}
