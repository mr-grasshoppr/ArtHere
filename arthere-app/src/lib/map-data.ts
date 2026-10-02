import { prisma } from '@/lib/db';
import { artistScopeWhere, type CityScope } from '@/lib/city-scope';
import { parseNeighborhoodList, isCityLevelNeighborhood } from '@/lib/neighborhoods';
import {
  buildParentIndex,
  buildRegionIndex,
  countArtistsByRegion,
  regionHitsFor,
  type MapRegionProperties,
  type RegionStat,
} from '@/lib/map-regions';
import { visibleArtworkImages, type OrderedArtworkImage } from '@/lib/artist-images';
import { getFocals } from '@/lib/image-focus';
import { gridFallbackFor, type Focal } from '@/lib/focal-style';
import regionsJson from '@/data/map-regions.json';

/** One pin — a single location of a place. A place with several stores has several. */
export interface MapPin {
  /** The PlaceLocation id. */
  id: string;
  /** The place's name — the hover card's heading. */
  name: string;
  lat: number;
  lng: number;
  /** The place's profile page, or null for a place with no public page. */
  href: string | null;
  imageUrl: string | null;
  /**
   * The hover card's grey line: the location's own label ("Hawthorne") when
   * the place has several, otherwise the place's first neighborhood.
   */
  subtitle: string;
}

/** An opted-in artist, as the region panel lists them. */
export interface MapArtist {
  slug: string;
  name: string;
  href: string;
  photoUrl: string | null;
  medium: string | null;
  /** Every region they count toward — neighborhood(s), quadrant, or city. */
  regionIds: string[];
  /** Framed exactly as on the artwork grid: its stored focal, else the grid's fallback. */
  artwork: { url: string; alt: string; focal: Focal | null; fallbackPosition: string }[];
}

export interface GeoMapData {
  regionStats: Record<string, RegionStat>;
  artists: MapArtist[];
  pins: MapPin[];
}

const regionProps = (regionsJson as unknown as { features: { properties: MapRegionProperties }[] }).features.map(
  (f) => f.properties
);

const regionIndex = buildRegionIndex(regionProps);
const parentIndex = buildParentIndex(regionProps);

type ArtistRow = {
  slug: string;
  name: string;
  neighborhood: string | null;
  medium: string | null;
  bioPhotoUrl: string | null;
  heroImageUrl: string | null;
  artworkImages: (OrderedArtworkImage & { url: string; altText: string | null; uploadedAt: Date })[];
};

/**
 * Artists as the region panel needs them. Shared with any other loader.
 * Async because it fetches each piece's stored framing, so panel tiles crop
 * exactly like the artwork grid and the artist's own gallery.
 */
export async function toMapArtists(slug: string, artists: ArtistRow[]): Promise<MapArtist[]> {
  const focals = await getFocals(artists.flatMap((a) => a.artworkImages.map((img) => img.url)));
  return artists.map((a) => ({
    slug: a.slug,
    name: a.name,
    href: `/cities/${slug}/artists/${a.slug}`,
    photoUrl: a.bioPhotoUrl ?? a.heroImageUrl ?? null,
    medium: a.medium,
    regionIds: [...regionHitsFor(parseNeighborhoodList(a.neighborhood), regionIndex, parentIndex).keys()],
    artwork: visibleArtworkImages(a.artworkImages).map((img) => ({
      url: img.url,
      alt: img.altText ?? `Artwork by ${a.name}`,
      focal: focals.get(img.url) ?? null,
      fallbackPosition: gridFallbackFor(img.uploadedAt),
    })),
  }));
}

export const MAP_ARTIST_SELECT = {
  slug: true,
  name: true,
  neighborhood: true,
  medium: true,
  bioPhotoUrl: true,
  heroImageUrl: true,
  artworkImages: { where: { excludedFromGridAt: null }, orderBy: { sortOrder: 'asc' as const } },
} as const;

/**
 * Data for the map tab's Geographic view. Same source and same city scope as
 * the Network view (artistScopeWhere), narrowed to profiles that opted in via
 * showOnMap — only those artists are listed in a region's panel.
 */
export async function getGeoMapData(slug: string, scope: CityScope): Promise<GeoMapData> {
  const [artists, places] = await Promise.all([
    prisma.artist.findMany({
      where: { ...artistScopeWhere(scope), showOnMap: true },
      orderBy: { name: 'asc' },
      select: MAP_ARTIST_SELECT,
    }),
    prisma.place.findMany({
      where: { cityId: { in: scope.cityIds }, showOnMap: true, isArchived: false },
      select: {
        slug: true,
        name: true,
        neighborhood: true,
        inDirectory: true,
        heroImageUrl: true,
        thumbnailImageUrl: true,
        locations: {
          where: { lat: { not: null }, lng: { not: null } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
  ]);

  const { stats: regionStats } = countArtistsByRegion(
    regionProps,
    artists.map((a) => parseNeighborhoodList(a.neighborhood))
  );

  return {
    regionStats,
    artists: await toMapArtists(slug, artists),
    pins: places.flatMap((p) => {
      const neighborhood = parseNeighborhoodList(p.neighborhood).filter((n) => !isCityLevelNeighborhood(n))[0] ?? '';
      return p.locations.map((loc) => ({
        id: loc.id,
        name: p.name,
        lat: loc.lat!,
        lng: loc.lng!,
        href: p.inDirectory ? `/cities/${slug}/places/${p.slug}` : null,
        imageUrl: p.thumbnailImageUrl ?? p.heroImageUrl ?? null,
        subtitle: loc.label ?? neighborhood,
      }));
    }),
  };
}
