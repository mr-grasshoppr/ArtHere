import Link from 'next/link';
import { ArtworkTileImage } from '@/components/ArtworkTileImage';
import type { Focal } from '@/lib/focal-style';
import styles from './nordlys.module.css';

export interface MosaicPiece {
  src: string;
  focal: Focal | null;
  fallbackPosition: string;
  alt: string;
  artistName: string;
  href: string;
}

/**
 * A static taste of the city's artwork grid: nine real pieces, each by a
 * different artist (so GRID-2/GRID-3 hold by construction — no artwork and
 * no artist twice in a view), framed by the same ArtworkTileImage the grid
 * uses (GRID-9 white-border crop). Heroes are never used, since they are
 * wide tiles (GRID-11) and this is a plain square mosaic.
 */
export function Mosaic({ pieces }: { pieces: MosaicPiece[] }) {
  return (
    <ul className={styles.mosaic} aria-label="Artwork from local artists">
      {pieces.map((p, i) => (
        <li key={p.src}>
          <Link href={p.href} className={styles.tile}>
            <ArtworkTileImage
              src={p.src}
              alt={p.alt}
              sizes="(max-width: 1024px) 30vw, 170px"
              quality={75}
              focal={p.focal}
              fallbackPosition={p.fallbackPosition}
              loading={i < 6 ? 'eager' : 'lazy'}
            />
            <span className={styles.tileName}>{p.artistName}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
