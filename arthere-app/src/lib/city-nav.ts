import type { CityNav } from '@/components/NavBarClient';

/**
 * The section links every page of a city shows in the site nav:
 * "Portland, OR  artwork  artists  network". The city name and "artwork"
 * are the same page — the city page is the artwork grid — so the name is
 * the home link and the tabs say where you are within the city.
 */
export function cityNavFor(slug: string, cityLabel: string): CityNav {
  const home = `/cities/${slug}`;
  return {
    cityLabel,
    cityHref: home,
    tabs: [
      { label: 'artwork', href: home },
      { label: 'artists', href: `${home}/artists` },
      { label: 'network', href: `${home}/network` },
    ],
  };
}
