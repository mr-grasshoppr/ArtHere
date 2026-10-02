// Street address -> lat/lng for a place's map pins, via OpenStreetMap's free
// Nominatim geocoder. Called only when a place is saved with a new or changed
// address — never on page load — which keeps us inside Nominatim's usage
// policy (max 1 request/second, identifying User-Agent, no bulk use).

import { prisma } from '@/lib/db';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ArtHere/1.0 (https://artishere.org)';
// Nominatim allows one request a second; a place saving several new
// addresses at once waits this long between lookups.
const REQUEST_GAP_MS = 1100;
// Hard cap per place — plenty for a shop with several stores, and bounds
// how long a save can spend geocoding.
export const MAX_PLACE_LOCATIONS = 6;

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const q = address.trim();
  if (!q) return null;
  const params = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'us' });
  try {
    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    // A geocoder outage must never block saving a profile — the location
    // just has no pin until it's saved again.
    return null;
  }
}

export interface PlaceLocationInput {
  label?: string | null;
  streetAddress: string;
}

const normalizeAddress = (s: string) => s.trim().replace(/\s+/g, ' ');

/**
 * Replace a place's locations with `inputs`, in order. Addresses that were
 * already saved keep their coordinates (so re-saving an unrelated field, or
 * reordering, never hits Nominatim); only new or edited addresses — and old
 * ones that failed to geocode last time — are looked up. Blank rows are
 * dropped, and so are duplicates of an address already in the list.
 */
export async function syncPlaceLocations(placeId: string, inputs: PlaceLocationInput[]): Promise<void> {
  const existing = await prisma.placeLocation.findMany({ where: { placeId } });
  const known = new Map(existing.map((l) => [normalizeAddress(l.streetAddress).toLowerCase(), l]));

  const seen = new Set<string>();
  const rows: { label: string | null; streetAddress: string; lat: number | null; lng: number | null }[] = [];
  let lookedUp = 0;
  for (const input of inputs) {
    const streetAddress = normalizeAddress(input.streetAddress ?? '');
    const key = streetAddress.toLowerCase();
    if (!streetAddress || seen.has(key)) continue;
    seen.add(key);
    if (rows.length >= MAX_PLACE_LOCATIONS) break;

    const label = input.label?.trim() || null;
    const prior = known.get(key);
    if (prior && prior.lat != null && prior.lng != null) {
      rows.push({ label, streetAddress, lat: prior.lat, lng: prior.lng });
      continue;
    }
    if (lookedUp++ > 0) await new Promise((r) => setTimeout(r, REQUEST_GAP_MS));
    const hit = await geocodeAddress(streetAddress);
    rows.push({ label, streetAddress, lat: hit?.lat ?? null, lng: hit?.lng ?? null });
  }

  await prisma.$transaction([
    prisma.placeLocation.deleteMany({ where: { placeId } }),
    prisma.placeLocation.createMany({ data: rows.map((r, i) => ({ ...r, placeId, sortOrder: i })) }),
  ]);
}
