'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { focalStyle, DEFAULT_OBJECT_POSITION, type Focal } from '@/lib/focal-style';
import { heroTileWindow, type ImageWindow } from '@/lib/hero-band';

type Props = Omit<ImageProps, 'fill' | 'style'> & {
  /** The piece's stored framing (focal point + zoom), if any. */
  focal?: Focal | null;
  /** Where to sit an unframed piece in its tile. */
  fallbackPosition?: string;
  /** An artist's hero image — framed by its header band (GRID-11). */
  isHero?: boolean;
};

/**
 * Sizes and places a box, in its tile, so that the box is the whole image
 * scaled up and shifted until exactly `win` of it sits inside the tile.
 */
function windowBox(win: ImageWindow): CSSProperties {
  return {
    position: 'absolute',
    width: `${100 / win.width}%`,
    height: `${100 / win.height}%`,
    left: `${(-win.left / win.width) * 100}%`,
    top: `${(-win.top / win.height) * 100}%`,
  };
}

/**
 * An artwork filling its tile, framed the way the rest of the site frames it:
 * a gallery piece by its focal point and zoom (focalStyle), exactly as on the
 * artist's own page; a hero by the band its 21:9 profile header shows, so the
 * tile's top and bottom match the header (see lib/hero-band.ts). Shared by
 * the city artwork grid and the map's region panel so the two can't drift.
 *
 * A hero's band depends on the image's real proportions and the tile's shape,
 * so it's measured once the image has loaded (and again if the tile resizes);
 * until then the tile shows its ordinary framing. The band is drawn by an
 * oversized box the image fills — next/image's `fill` won't take a size of
 * its own.
 */
export function ArtworkTileImage({ alt, sizes, focal, fallbackPosition = DEFAULT_OBJECT_POSITION, isHero = false, onLoad, ...props }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  const [tile, setTile] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    const cell = box?.parentElement;
    if (!isHero || !box || !cell) return;
    // Already loaded from cache before React attached onLoad.
    const img = box.querySelector('img');
    if (img?.complete && img.naturalWidth > 0) setImageAspect(img.naturalWidth / img.naturalHeight);
    const measure = () => {
      const { width, height } = cell.getBoundingClientRect();
      if (width > 0 && height > 0) setTile({ width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cell);
    return () => observer.disconnect();
  }, [isHero]);

  const heroWindow = isHero && imageAspect && tile ? heroTileWindow(focal ?? null, imageAspect, tile.width / tile.height) : null;

  const image = (
    <Image
      {...props}
      alt={alt}
      // A hero shows only a band of its image, so the image is drawn wider
      // than the tile — ask for a source that wide, or the tile looks soft.
      sizes={heroWindow && tile ? `${Math.ceil(tile.width / heroWindow.width)}px` : sizes}
      fill
      // Inside the band box the image has the box's exact proportions, so a
      // plain cover fill shows all of it, undistorted.
      style={heroWindow ? undefined : focalStyle(focal, fallbackPosition)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (isHero && img.naturalWidth > 0) setImageAspect(img.naturalWidth / img.naturalHeight);
        onLoad?.(e);
      }}
    />
  );

  if (!isHero) return image;
  return (
    <div ref={boxRef} style={heroWindow ? windowBox(heroWindow) : { position: 'absolute', inset: 0 }}>
      {image}
    </div>
  );
}
