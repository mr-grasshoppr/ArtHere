'use client';

import { CityGrid, type ArtistGridData } from '@/components/CityGrid';
import styles from './vibra.module.css';

/**
 * The city's real ambient artwork grid, set inside the page as a window onto
 * the wall. CityGrid is the same component (and the same planner) the city
 * page uses, so the spacing rules in REQUIRED-DESIGN-FEATURES.md are enforced
 * by it, untouched. Tap to freeze and tiles become links to artists.
 */
export function Wall({ artists, overlayImageUrl }: { artists: ArtistGridData[]; overlayImageUrl: string }) {
  return (
    <div className={styles.wall}>
      <CityGrid artists={artists} overlayImageUrl={overlayImageUrl} maskImageUrl="/images/arthere-mask.png" />
      <p className={styles.wallHint} aria-hidden>Tap the wall to stop it &middot; tap art to meet the artist</p>
    </div>
  );
}
