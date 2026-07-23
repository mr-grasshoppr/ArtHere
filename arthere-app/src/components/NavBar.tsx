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

  const cities: CityEntry[] = rawCities.map(c => ({
    slug: c.slug,
    name: c.name,
    state: c.state,
    displayName: c.displayName,
  }));

  return <NavBarClient cities={cities} activeCitySlug={activeCitySlug} theme={theme} />;
}
