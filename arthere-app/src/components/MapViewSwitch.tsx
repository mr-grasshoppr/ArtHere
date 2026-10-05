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
      className="inline-flex gap-1.5 p-1 rounded-lg bg-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-sm"
    >
      {MAP_VIEWS.map((view) => {
        const isActive = view.key === active;
        return (
          <Link
            key={view.key}
            href={`/cities/${citySlug}/map?view=${view.key}`}
            aria-current={isActive ? 'page' : undefined}
            scroll={false}
            // The view you're on is solid white; the other is outlined, so
            // both read clearly over a dark map.
            className={`px-3.5 py-1.5 rounded-md border text-[0.75rem] font-medium transition-colors ${
              isActive
                ? 'bg-white border-white text-black'
                : 'border-white text-white hover:bg-white/15'
            }`}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
