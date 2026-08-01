import styles from './AnimatedLogoMask.module.css';

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
}

export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '' }: Props) {
  return (
    <div className={`${styles.mask} ${className}`} style={{ width }}>
      <div className={styles.track}>
        {/* Two identical copies of the same wide composition so the
            -50% scroll loops seamlessly — see the module CSS. */}
        <div className={styles.slide} />
        <div className={styles.slide} />
      </div>
    </div>
  );
}
