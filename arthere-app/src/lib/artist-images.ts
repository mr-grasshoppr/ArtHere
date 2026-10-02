import { MAX_ARTWORK_IMAGES } from './artist-options';

/**
 * Which of an artist's pieces the site actually shows.
 *
 * A profile has room for a header image and three gallery pieces. Artists
 * can upload more than that — nothing is refused, and nothing is thrown
 * away — but the extras sit behind the profile, marked "not visible", until
 * the artist swaps one into a slot. This is the single definition of that
 * slice: the profile page, the city artwork grid and the admin editor all
 * read it from here rather than each re-deriving "hero plus the first
 * three", which is how the grid ended up showing pieces that the artist's
 * own page did not.
 */
export interface OrderedArtworkImage {
  isHero: boolean;
  sortOrder: number;
}

/** The header image, if one is set. */
export function heroImageOf<T extends OrderedArtworkImage>(images: T[]): T | null {
  return images.find(img => img.isHero) ?? null;
}

/** Gallery pieces, in slot order — at most `MAX_ARTWORK_IMAGES - 1`. */
export function galleryImagesOf<T extends OrderedArtworkImage>(images: T[]): T[] {
  return images
    .filter(img => !img.isHero)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, MAX_ARTWORK_IMAGES - 1);
}

/** Everything the site shows for this artist: the header, then the gallery. */
export function visibleArtworkImages<T extends OrderedArtworkImage>(images: T[]): T[] {
  const hero = heroImageOf(images);
  const gallery = galleryImagesOf(images);
  return hero ? [hero, ...gallery] : gallery;
}

/** Uploaded, kept, and not currently shown anywhere. */
export function hiddenArtworkImages<T extends OrderedArtworkImage>(images: T[]): T[] {
  const shown = new Set<T>(visibleArtworkImages(images));
  return images.filter(img => !shown.has(img)).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * The gallery slot a piece occupies (1-based), or null when it isn't shown.
 * Used for the editors' "Gallery Image 2" style labels.
 */
export function gallerySlotOf<T extends OrderedArtworkImage & { id: string }>(
  images: T[],
  imageId: string
): number | null {
  const i = galleryImagesOf(images).findIndex(img => img.id === imageId);
  return i >= 0 ? i + 1 : null;
}
