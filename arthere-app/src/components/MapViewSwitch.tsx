import Link from 'next/link';

// The first is the default: what the nav bar's "map" link opens.
export const MAP_VIEWS = [
  { key: 'geographic', label: 'Geographic' },
  { key: 'network', label: 'Network' },
] as const;

export type MapView = (typeof MAP_VIEWS)[number]['key'];

/** Anything unrecognised (or missing) falls back to the first view. */
export function parseMapView(raw: string | string[] | undefined): MapView {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return MAP_VIEWS.find((m) => m.key === v)?.key ?? MAP_VIEWS[0].key;
}

/**
 * The Network / Geographic segmented control at the top of the map tab.
 * Plain links to ?view=…, so every view has its own shareable URL and the
 * control works before JS loads.
 */
export function MapViewSwitch({ citySlug, active }: { citySlug: string; active: MapView }) {
  return (
    <nav
      aria-label="Map views"
      className="inline-flex p-0.5 rounded-md bg-[#1c1c1c]/90 border border-[#333] shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-sm"
    >
      {MAP_VIEWS.map((view) => {
        const isActive = view.key === active;
        return (
          <Link
            key={view.key}
            href={`/cities/${citySlug}/map?view=${view.key}`}
            aria-current={isActive ? 'page' : undefined}
            scroll={false}
            className={`px-3 py-[5px] rounded-[5px] text-[0.625rem] font-medium transition-colors ${
              isActive ? 'bg-[#3a3a3a] text-white' : 'text-[#999] hover:text-[#ddd]'
            }`}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
