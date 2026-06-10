import Image from 'next/image';
import Link from 'next/link';

export interface ArtistCardData {
  slug: string;
  name: string;
  photoUrl: string | null;
  medium: string | null;
  neighborhood: string | null;
  /** Names of galleries/studios/collectives this artist is part of. */
  communities: string[];
}

interface Props {
  artists: ArtistCardData[];
}

/**
 * Browsable grid of artist profile cards (circular photo, name, medium,
 * neighborhood). Each card links to that artist's profile page.
 * Used by the city "artists" tab and reusable for future directory views.
 */
export function ArtistsGrid({ artists }: Props) {
  if (artists.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-16 text-center text-[#888]">
        No artists to show yet — check back soon.
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-10 pt-8 sm:pt-10 pb-10 sm:pb-[60px] grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8">
      {artists.map(artist => (
        <Link
          key={artist.slug}
          href={`/artists/${artist.slug}`}
          className="block text-center text-inherit no-underline transition-opacity duration-200 hover:opacity-80"
        >
          <div className="w-full aspect-square rounded-full overflow-hidden bg-[#f4f4f0] mb-3.5">
            {artist.photoUrl && (
              <Image
                src={artist.photoUrl}
                alt={artist.name}
                width={400}
                height={400}
                className="w-full h-full object-cover object-top block"
              />
            )}
          </div>
          <div className="font-heading text-[1.05rem] font-bold mb-[3px]">{artist.name}</div>
          {artist.medium && (
            <div className="text-[0.82rem] text-[#888] font-light mb-0.5">{artist.medium}</div>
          )}
          {artist.neighborhood && (
            <div className="text-[0.78rem] text-[#bbb] font-light">{artist.neighborhood}</div>
          )}
        </Link>
      ))}
    </div>
  );
}
