"use client";

import { useEffect, useState } from "react";

const HERO_RATIO = 9 / 21;
const HERO_MIN_HEIGHT = 200;
const HERO_MAX_HEIGHT = 420;

/**
 * The shape the live profile's header takes in a window this wide: full width,
 * 21:9 tall, but held between 200px and 420px high. So its crop is wider and
 * shorter than a plain 21:9 on a big screen and taller on a phone. Editors use
 * this to show (and to frame against) the crop this screen will publish.
 */
export function useLiveHeroAspect(): string {
  const [aspect, setAspect] = useState("21 / 9");
  useEffect(() => {
    const update = () => {
      const width = document.documentElement.clientWidth;
      if (width <= 0) return;
      const height = Math.min(HERO_MAX_HEIGHT, Math.max(HERO_MIN_HEIGHT, width * HERO_RATIO));
      setAspect(`${Math.round(width)} / ${Math.round(height)}`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return aspect;
}
