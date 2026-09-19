import type { CityNav } from '@/components/NavBarClient';

/**
 * The section links every page of a city shows in the site nav:
 * "Portland, OR  artwork  artists  network". The city name and "artwork"
 * are the same page — the city page is the artwork grid — but they open it
 * in different states: the name starts the ambient scroll, "artwork" lands
 * on the grid already frozen with the filter bar showing (the `browse`
 * flag, read by CityArtworkView).
 */
export function cityNavFor(slug: string, cityLabel: string): CityNav {
  const home = `/cities/${slug}`;
  return {
    cityLabel,
    cityHref: home,
    tabs: [
      { label: 'artwork', href: `${home}?browse` },
      { label: 'artists', href: `${home}/artists` },
      { label: 'network', href: `${home}/network` },
    ],
  };
}
