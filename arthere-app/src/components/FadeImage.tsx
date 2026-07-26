'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ImageProps } from 'next/image';

/**
 * Next.js Image that fades in from transparent once it finishes loading, so
 * images resolve gracefully instead of popping in at full opacity.
 *
 * The transition also covers `transform` because this inline style overrides
 * any `transition-*` utility class on the element — several callers rely on a
 * hover scale that would otherwise snap.
 */
export function FadeImage({ className = '', style, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // A cached image can already be complete before hydration attaches the
  // onLoad handler — in that case onLoad never fires and the image would be
  // stuck at opacity 0. Detect it on mount so it still reveals.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <Image
      {...props}
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.6s ease, transform 0.4s ease',
      }}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
