'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  label: string;
  href: string;
}

interface Props {
  citySlug: string;
  cityDisplayName: string;
}

export function CityBottomBar({ citySlug, cityDisplayName }: Props) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { label: 'artwork',    href: `/cities/${citySlug}/artwork` },
    { label: 'artists',   href: `/cities/${citySlug}/artists` },
    { label: 'community', href: `/cities/${citySlug}/community` },
    { label: 'network',   href: `/cities/${citySlug}/network` },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center px-[18px] gap-7 z-[100]"
      style={{
        height: 56,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* City name — links back to the city's home page; hidden on narrow screens */}
      <Link
        href={`/cities/${citySlug}`}
        className="font-heading flex-shrink-0 text-[0.95rem] font-bold text-white tracking-[0.03em] hidden sm:block no-underline transition-opacity hover:opacity-60"
      >
        {cityDisplayName}
      </Link>
      <span className="text-[#444] text-[0.9rem] flex-shrink-0 hidden sm:block">|</span>

      {tabs.map(tab => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-white/55 no-underline text-[0.88rem] font-medium tracking-[0.04em] py-1 transition-colors duration-200 border-b-[1.5px] border-transparent hover:text-white hover:border-white/60"
            style={isActive ? { color: '#fff', borderColor: 'rgba(255,255,255,0.6)' } : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
