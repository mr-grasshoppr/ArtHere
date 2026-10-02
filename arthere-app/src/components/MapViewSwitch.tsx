import Link from 'next/link';

export const MAP_VIEWS = [
  { key: 'network', label: 'Network' },
  { key: 'geographic', label: 'Geographic' },
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
      className="inline-flex p-0.5 rounded-lg bg-[#111]/90 border border-[#222] shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-sm"
    >
      {MAP_VIEWS.map((view) => {
        const isActive = view.key === active;
        return (
          <Link
            key={view.key}
            href={`/cities/${citySlug}/map?view=${view.key}`}
            aria-current={isActive ? 'page' : undefined}
            scroll={false}
            className={`px-3.5 py-1.5 rounded-md text-[0.75rem] font-medium transition-colors ${
              isActive ? 'bg-[#2a2a2a] text-white' : 'text-[#888] hover:text-[#ddd]'
            }`}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
