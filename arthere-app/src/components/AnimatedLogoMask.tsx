import styles from './AnimatedLogoMask.module.css';

const SLIDES = [
  { cls: styles.kurtisBg, name: 'Kurtis Piltz',    showCredit: true  },
  { cls: styles.yongBg,   name: 'Yong Hong Zhong', showCredit: false },
];

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
}

export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '' }: Props) {
  return (
    <div
      className={`${styles.mask} ${className}`}
      style={{ width, '--slide-width': width } as React.CSSProperties}
    >
      <div className={styles.track}>
        {[...SLIDES, ...SLIDES].map((s, i) => (
          <div key={i} className={styles.slide} style={{ width }}>
            <div className={s.cls} />
            {s.showCredit && <span className={styles.credit}>{s.name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
