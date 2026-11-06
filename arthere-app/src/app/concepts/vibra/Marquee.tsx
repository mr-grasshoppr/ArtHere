import styles from './vibra.module.css';

/** Street-poster ticker of the real artists in the city. Pure CSS; paused for reduced motion. */
export function Marquee({ names }: { names: string[] }) {
  const run = (
    <>
      {names.map((n, i) => (
        <span key={n + i} className={styles.marqueeItem}>
          {n}
          <span aria-hidden className={styles.marqueeDot} />
        </span>
      ))}
    </>
  );
  return (
    <div className={styles.marquee} role="region" aria-label="Artists on Art Here">
      <div className={styles.marqueeTrack}>
        <div className={styles.marqueeRun}>{run}</div>
        <div className={styles.marqueeRun} aria-hidden>{run}</div>
      </div>
    </div>
  );
}
