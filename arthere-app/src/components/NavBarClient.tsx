'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface CityEntry {
  slug: string;
  displayName: string | null;
  name: string;
  state: string | null;
}

export type NavBarTheme = 'dark' | 'light';

/**
 * A city's section links, shown inline in the bar between the logo and the
 * menu: "Portland, OR  artwork  artists  network". The city name and the
 * first tab point at the same page, so the name is the home link and the
 * tabs are where you are within it.
 */
export interface CityNav {
  cityLabel: string;
  cityHref: string;
  tabs: { label: string; href: string }[];
}

interface Props {
  cities: CityEntry[];
  activeCitySlug?: string;
  /** 'dark' (default) = black bar for the "now playing" city pages.
   *  'light' = white bar for content/directory pages. */
  theme?: NavBarTheme;
  cityNav?: CityNav;
}

export function NavBarClient({ cities, activeCitySlug, theme = 'dark', cityNav }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const pathname = usePathname();
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

        {/* City section links — the city name goes home, the tabs go to the
            sections. The row is the logo's height and bottom-aligned, so
            the text sits on the logo's baseline. Scrolls sideways on narrow
            screens rather than wrapping into a second row. */}
        {cityNav && (
          <nav className="flex items-end h-[38px] gap-5 sm:gap-7 ml-3 sm:ml-6 min-w-0 overflow-x-auto [scrollbar-width:none]">
            <Link
              href={cityNav.cityHref}
              className={`font-display flex-shrink-0 text-[1.35rem] leading-none tracking-[0.05em] no-underline transition-opacity hover:opacity-60 ${
                isLight ? 'text-[#1a1a1a]' : 'text-white'
              }`}
            >
              {cityNav.cityLabel}
            </Link>
            {cityNav.tabs.map(tab => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`flex-shrink-0 no-underline text-[0.88rem] leading-none font-medium tracking-[0.04em] pb-[3px] transition-colors duration-200 border-b-[1.5px] border-transparent ${
                    isLight
                      ? 'text-[#1a1a1a]/55 hover:text-[#1a1a1a] hover:border-[#1a1a1a]/60'
                      : 'text-white/55 hover:text-white hover:border-white/60'
                  }`}
                  style={
                    isActive
                      ? isLight
                        ? { color: '#1a1a1a', borderColor: 'rgba(26,26,26,0.6)' }
                        : { color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }
                      : undefined
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}

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
              className={`absolute top-[calc(100%+8px)] right-0 rounded-md min-w-[160px] ${
                isLight
                  ? 'bg-white border border-[#eee] shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                  : 'bg-[#1a1a1a] border border-[#333] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
              }`}
            >
              <Link
                href="/#about"
                className={`block px-5 py-[13px] text-[0.9rem] transition-colors ${
                  isLight
                    ? 'text-[#444] border-b border-[#f0f0f0] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    : 'text-[#ccc] border-b border-[#222] hover:bg-[#222] hover:text-white'
                }`}
                onClick={closeAll}
              >
                About Us
              </Link>
              <Link
                href="/#contact"
                className={`block px-5 py-[13px] text-[0.9rem] transition-colors border-b ${
                  isLight
                    ? 'text-[#444] border-[#f0f0f0] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    : 'text-[#ccc] border-[#222] hover:bg-[#222] hover:text-white'
                }`}
                onClick={closeAll}
              >
                Join Us
              </Link>
              {/* Cities submenu — flies out to the left of the main panel,
                  since the panel itself is anchored to the right edge of
                  the screen (a rightward flyout would run off-viewport). */}
              <div className="relative">
                <button
                  className={`w-full flex justify-between items-center px-5 py-[13px] text-[0.9rem] transition-colors bg-transparent border-none border-b cursor-pointer font-[inherit] ${
                    isLight
                      ? 'text-[#444] border-[#f0f0f0] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                      : 'text-[#ccc] border-[#222] hover:bg-[#222] hover:text-white'
                  }`}
                  onClick={e => { e.stopPropagation(); setCitiesOpen(o => !o); }}
                  aria-expanded={citiesOpen}
                >
                  Cities
                  <span className={`text-[0.65rem] ${isLight ? 'text-[#ccc]' : 'text-[#555]'}`}>
                    &#9664;
                  </span>
                </button>

                {citiesOpen && (
                  <div
                    className={`absolute top-0 right-full mr-1 rounded-md min-w-[160px] ${
                      isLight
                        ? 'bg-white border border-[#eee] shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                        : 'bg-[#1a1a1a] border border-[#333] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    {cities.map(city => {
                      const label = city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;
                      return (
                        <Link
                          key={city.slug}
                          href={`/cities/${city.slug}`}
                          className={`block px-5 py-[13px] text-[0.9rem] transition-colors no-underline ${
                            isLight
                              ? 'text-[#444] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                              : 'text-[#ccc] hover:bg-[#222] hover:text-white'
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
                href="/my-art-here"
                className={`block px-5 py-[13px] text-[0.9rem] transition-colors border-b ${
                  isLight
                    ? 'text-[#444] border-[#f0f0f0] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    : 'text-[#ccc] border-[#222] hover:bg-[#222] hover:text-white'
                }`}
                onClick={closeAll}
              >
                My Art Here
              </Link>
              <Link
                href="/survey?src=nav_menu"
                className={`block px-5 py-[13px] text-[0.9rem] transition-colors ${
                  isLight
                    ? 'text-[#444] border-b border-[#f0f0f0] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    : 'text-[#ccc] border-b border-[#222] hover:bg-[#222] hover:text-white'
                }`}
                onClick={closeAll}
              >
                Take the Survey
              </Link>

              <Link
                href="/#get-in-touch"
                className={`block px-5 py-[13px] text-[0.9rem] transition-colors ${
                  isLight
                    ? 'text-[#444] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    : 'text-[#ccc] hover:bg-[#222] hover:text-white'
                }`}
                onClick={closeAll}
              >
                Contact Us
              </Link>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
