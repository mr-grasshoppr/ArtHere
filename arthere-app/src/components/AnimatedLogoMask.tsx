import Image from 'next/image';
import styles from './AnimatedLogoMask.module.css';

// Approved for this treatment — confirm with an artist before adding more.
const ARTWORKS = [
  '/images/Kurtis_Piltz1.jpeg',
  '/images/Kristin_Casaletto_LetItPullMeOut.jpg',
  '/images/Kristin_Casaletto_SavingForLater.jpg',
];

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
}

export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '' }: Props) {
  return (
    <div className={`${styles.mask} ${className}`} style={{ width }}>
      <div className={styles.frame} style={{ animationDelay: '0s' }} />
      {ARTWORKS.map((src, i) => (
        <div key={src} className={styles.frame} style={{ animationDelay: `${-6 - i * 6}s` }}>
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 60vw, 520px"
            priority={i === 0}
            className={styles.frameImg}
            style={{ animationDelay: `${-6 - i * 6}s` }}
          />
        </div>
      ))}
    </div>
  );
}
