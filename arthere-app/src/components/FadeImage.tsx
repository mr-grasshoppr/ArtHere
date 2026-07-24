'use client';
import Image from 'next/image';
import { useState } from 'react';
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
  return (
    <Image
      {...props}
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
