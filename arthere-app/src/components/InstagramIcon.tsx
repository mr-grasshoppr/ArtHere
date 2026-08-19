import styles from './InstagramIcon.module.css';

// Instagram glyph masked to the same wide green/pink gradient photo used
// behind the hero wordmark, animated panning right to left (see
// InstagramIcon.module.css for the mask + animation).
export function InstagramIcon({ size = 56 }: { size?: number }) {
  return (
    <div className={styles.igMask} style={{ width: size, height: size }}>
      <div className={styles.igGradient} />
    </div>
  );
}
