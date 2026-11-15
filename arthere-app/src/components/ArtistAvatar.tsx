import Image from 'next/image';

/** Small round bio photo for an artist, falling back to their initial. */
export function ArtistAvatar({ url, name, size = 32 }: { url?: string | null; name: string; size?: number }) {
  return (
    <span
      className="relative inline-block flex-shrink-0 rounded-full overflow-hidden bg-[#f4f4f0] align-middle"
      style={{ width: size, height: size }}
    >
      {url ? (
        // unoptimized: bio photos come from several hosts, not all in next.config's list
        <Image src={url} alt="" width={size} height={size} unoptimized className="object-cover w-full h-full" />
      ) : (
        <span className="flex items-center justify-center w-full h-full text-[0.7rem] text-[#999]" aria-hidden>
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
