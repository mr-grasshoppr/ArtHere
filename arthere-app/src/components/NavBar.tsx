import { getCachedCities } from '@/lib/cities';
import { NavBarClient, type CityEntry, type NavBarTheme } from './NavBarClient';

interface Props {
  activeCitySlug?: string;
  /** 'dark' (default) = black bar for the "now playing" city pages.
   *  'light' = white bar for content/directory pages. */
  theme?: NavBarTheme;
}

export async function NavBar({ activeCitySlug, theme }: Props) {
  const rawCities = await getCachedCities();

  // Demo cities (slug ending "-demo", see lib/city-scope.ts) are a gated
  // preview variant of their paired real city, not a public destination —
  // same displayName as the real city, so leaving them in would just show
  // e.g. "Portland, OR" twice in this menu.
  const cities: CityEntry[] = rawCities
    .filter(c => !c.slug.endsWith('-demo'))
    .map(c => ({
      slug: c.slug,
      name: c.name,
      state: c.state,
      displayName: c.displayName,
    }));

  return <NavBarClient cities={cities} activeCitySlug={activeCitySlug} theme={theme} />;
}
