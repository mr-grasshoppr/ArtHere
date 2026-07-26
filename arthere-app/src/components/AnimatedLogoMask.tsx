'use client';

import { useEffect, useState } from 'react';
import styles from './AnimatedLogoMask.module.css';

// The logo mask shows a single artwork behind the wordmark.
const IMAGE_URL =
  'https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/artists/yong-hong-zhong/yong-hero.png';

// Never leave the logo a bare silhouette longer than this, even if the image
// preload stalls — it fades in regardless once the deadline passes.
const MAX_WAIT_MS = 2000;

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
}

export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '' }: Props) {
  // The mask paints solid black immediately so the wordmark is on screen from
  // the first frame; the artwork fades in once it has actually decoded.
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    let done = false;
    const reveal = () => {
      if (!done) {
        done = true;
        setImageReady(true);
      }
    };

    const timer = setTimeout(reveal, MAX_WAIT_MS);
    const img = new Image();
    img.onload = img.onerror = reveal;
    img.src = IMAGE_URL;

    return () => {
      done = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`${styles.mask} ${className}`} style={{ width }}>
      <div
        className={`${styles.image} ${imageReady ? styles.imageVisible : ''}`}
        style={{ backgroundImage: `url(${IMAGE_URL})` }}
      />
    </div>
  );
}
