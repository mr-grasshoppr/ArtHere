'use client';

export interface LocationRow {
  label: string;
  streetAddress: string;
}

// Mirrors MAX_PLACE_LOCATIONS in lib/geocode.ts (server-only, so not imported).
const MAX_ROWS = 6;

/**
 * Street addresses for a place — usually one, several for a shop with more
 * than one store. Each geocoded address becomes its own pin on the city map.
 * Shared by the admin org editor and the place's own edit page, which pass
 * their own input styling.
 */
export function PlaceLocationsEditor({
  value,
  onChange,
  inputClassName,
  unresolved = [],
}: {
  value: LocationRow[];
  onChange: (rows: LocationRow[]) => void;
  inputClassName: string;
  /** Saved addresses the geocoder couldn't find — flagged, since they get no pin. */
  unresolved?: string[];
}) {
  const rows = value.length > 0 ? value : [{ label: '', streetAddress: '' }];
  const multi = rows.length > 1;
  const update = (i: number, patch: Partial<LocationRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i}>
          <div className="flex items-center gap-2">
            {/* A label only means something once there's more than one
                location to tell apart ("Hawthorne", "NW 23rd"). */}
            {multi && (
              <input
                type="text"
                value={row.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label, e.g. Hawthorne"
                className={`${inputClassName} max-w-[170px]`}
              />
            )}
            <input
              type="text"
              value={row.streetAddress}
              onChange={(e) => update(i, { streetAddress: e.target.value })}
              placeholder="Street address, city, ZIP"
              className={inputClassName}
            />
            {multi && (
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                aria-label="Remove this location"
                className="px-2 text-[#999] hover:text-[#1a1a1a] cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
          {unresolved.includes(row.streetAddress.trim()) && (
            <p className="mt-1 text-xs text-[#b45309]">
              Couldn&apos;t find this address on the map — check the spelling, or add the city and ZIP.
            </p>
          )}
        </div>
      ))}
      {rows.length < MAX_ROWS && (
        <button
          type="button"
          onClick={() => onChange([...rows, { label: '', streetAddress: '' }])}
          className="text-xs text-[#666] hover:text-[#1a1a1a] cursor-pointer"
        >
          + Add another location
        </button>
      )}
    </div>
  );
}
