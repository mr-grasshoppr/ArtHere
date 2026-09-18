import Link from 'next/link';

interface Props {
  cityName: string;
}

/**
 * Black band between the nav and the artist grid: the page's title in
 * Bebas, and a line inviting artists to join.
 */
export function DirectoryCallout({ cityName }: Props) {
  return (
    <div className="bg-[#1a1a1a] text-white">
      {/* px matches the nav's 18px so the title lines up under the logo. */}
      <div className="px-[18px] py-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="font-display text-[2rem] sm:text-[2.4rem] leading-none tracking-[0.04em]">
          Artists around {cityName}
        </span>
        <span className="text-[0.9rem] font-light text-white/65">
          Art Here is growing. {cityName} artist?{' '}
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
