'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { ImageProps } from 'next/image';

/** Next.js Image that fades in from transparent once it finishes loading. */
export function FadeImage({ className = '', style, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...props}
      className={className}
      style={{
        ...style,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
