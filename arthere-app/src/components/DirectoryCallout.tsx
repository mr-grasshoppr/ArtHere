import Link from 'next/link';

interface Props {
  cityName: string;
}

/**
 * Black band between the nav and the artist grid: says the directory is
 * growing and invites artists to join. Bebas statement, like the
 * homepage's band.
 */
export function DirectoryCallout({ cityName }: Props) {
  return (
    <div className="bg-[#1a1a1a] text-white">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-6 sm:py-7 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="font-display text-[2rem] sm:text-[2.4rem] leading-none tracking-[0.04em]">
          Art Here is growing.
        </span>
        <span className="text-[0.9rem] font-light text-white/65">
          {cityName} artist?{' '}
          <Link
            href="/contact?type=featured"
            className="text-white underline underline-offset-[3px] decoration-white/40 hover:decoration-white transition-colors"
          >
            Get featured →
          </Link>
        </span>
      </div>
    </div>
  );
}
