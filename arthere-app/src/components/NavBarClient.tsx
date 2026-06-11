'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface CityEntry {
  slug: string;
  displayName: string | null;
  name: string;
  state: string | null;
}

export type NavBarTheme = 'dark' | 'light';

interface Props {
  cities: CityEntry[];
  activeCitySlug?: string;
  /** 'dark' (default) = black bar for the "now playing" city pages.
   *  'light' = white bar for content/directory pages. */
  theme?: NavBarTheme;
}

export function NavBarClient({ cities, activeCitySlug, theme = 'dark' }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const isLight = theme === 'light';

  const activeCity = cities.find(c => c.slug === activeCitySlug);
  const activeCityLabel = activeCity
    ? (activeCity.displayName ?? `${activeCity.name}${activeCity.state ? `, ${activeCity.state}` : ''}`)
    : null;

  function closeAll() {
    setMenuOpen(false);
    setCitiesOpen(false);
  }

  return (
    <>
      {/* Overlay to close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-[150]" onClick={closeAll} aria-hidden />
      )}

      <div
        className={`fixed top-0 left-0 right-0 h-14 z-[200] flex items-center px-[18px] gap-3 ${
          isLight
            ? 'bg-white/[0.97] backdrop-blur-[10px] border-b border-[#eee]'
            : 'bg-black'
        }`}
        style={{ height: 56 }}
      >
        {/* Logo */}
        <Link href="/" onClick={closeAll} className="flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
          <Image
            src={isLight ? '/images/arthere-logo-dark.png' : '/images/arthere-logo-white.png'}
            alt="Art Here"
            width={120}
            height={38}
            className="h-[38px] w-auto"
            priority
          />
        </Link>

        {/* Hamburger menu */}
        <div className="relative flex-shrink-0 ml-auto z-[210]">
          <button
            className="bg-transparent border-none cursor-pointer p-1 flex flex-col gap-1"
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); if (menuOpen) setCitiesOpen(false); }}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span
              className={`block w-[18px] h-[1.5px] transition-all duration-[250ms] ${isLight ? 'bg-[#1a1a1a]' : 'bg-white/85'}`}
              style={menuOpen ? { transform: 'translateY(5.5px) rotate(45deg)' } : undefined}
            />
            <span
              className={`block w-[18px] h-[1.5px] transition-all duration-[250ms] ${isLight ? 'bg-[#1a1a1a]' : 'bg-white/85'}`}
              style={menuOpen ? { opacity: 0 } : undefined}
            />
            <span
              className={`block w-[18px] h-[1.5px] transition-all duration-[250ms] ${isLight ? 'bg-[#1a1a1a]' : 'bg-white/85'}`}
              style={menuOpen ? { transform: 'translateY(-5.5px) rotate(-45deg)' } : undefined}
            />
          </button>

          {menuOpen && (
            <div
              className={`absolute top-[calc(100%+8px)] right-0 rounded-md overflow-hidden min-w-[160px] ${
                isLight
                  ? 'bg-white border border-[#eee] shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                  : 'bg-[#1a1a1a] border border-[#333] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
              }`}
            >
              <Link
                href="/survey"
                className={`block px-5 py-[13px] text-[0.9rem] font-semibold transition-colors ${
                  isLight
                    ? 'text-[#1a1a1a] border-b border-[#f0f0f0] hover:bg-[#fafafa]'
                    : 'text-white border-b border-[#222] hover:bg-[#222]'
                }`}
                onClick={closeAll}
              >
                Join Us
              </Link>

              {/* Cities submenu */}
              <div>
                <button
                  className={`w-full flex justify-between items-center px-5 py-[13px] text-[0.9rem] transition-colors bg-transparent border-none border-b cursor-pointer font-[inherit] ${
                    isLight
                      ? 'text-[#444] border-[#f0f0f0] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                      : 'text-[#ccc] border-[#222] hover:bg-[#222] hover:text-white'
                  }`}
                  onClick={e => { e.stopPropagation(); setCitiesOpen(o => !o); }}
                >
                  Cities
                  <span
                    className={`text-[0.65rem] transition-transform duration-200 ${isLight ? 'text-[#ccc]' : 'text-[#555]'}`}
                    style={citiesOpen ? { transform: 'rotate(90deg)' } : undefined}
                  >
                    &#9654;
                  </span>
                </button>

                {citiesOpen && (
                  <div className={isLight ? 'bg-[#fafafa] border-b border-[#f0f0f0]' : 'bg-[#111] border-b border-[#222]'}>
                    {cities.map(city => {
                      const label = city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;
                      return (
                        <Link
                          key={city.slug}
                          href={`/cities/${city.slug}`}
                          className={`flex items-baseline gap-2 px-7 py-[9px] text-[0.85rem] transition-colors no-underline ${
                            isLight
                              ? 'text-[#1a1a1a] hover:bg-[#f0f0f0]'
                              : 'text-[#ccc] hover:bg-[#1a1a1a] hover:text-white'
                          }`}
                          onClick={closeAll}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                href="/#about"
                className={`block px-5 py-[13px] text-[0.9rem] transition-colors ${
                  isLight
                    ? 'text-[#444] border-b border-[#f0f0f0] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    : 'text-[#ccc] border-b border-[#222] hover:bg-[#222] hover:text-white'
                }`}
                onClick={closeAll}
              >
                About
              </Link>
              <Link
                href="/#contact"
                className={`block px-5 py-[13px] text-[0.9rem] transition-colors ${
                  isLight
                    ? 'text-[#444] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    : 'text-[#ccc] hover:bg-[#222] hover:text-white'
                }`}
                onClick={closeAll}
              >
                Contact
              </Link>
            </div>
          )}
        </div>

        {/* Active city name (shown when on a city page) */}
        {activeCityLabel && activeCitySlug && (
          <Link
            href={`/cities/${activeCitySlug}`}
            className={`font-heading font-bold text-[1rem] no-underline tracking-[0.03em] hover:opacity-70 transition-opacity ${
              isLight ? 'text-[#1a1a1a]' : 'text-white/85'
            }`}
            onClick={closeAll}
          >
            {activeCityLabel}
          </Link>
        )}
      </div>
    </>
  );
}
