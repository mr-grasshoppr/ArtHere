// Where the map tab's two views were left — zoom and position — so switching
// between Geographic and Network, or opening an artist from the map and
// coming back, picks up where you were.
//
// A "session" is this browser tab, until you go somewhere through the nav bar
// (which clears it — see NavBarClient) or close the tab. Reset view in either
// view simply records the reset position. Kept in sessionStorage, which can
// be missing or throw (private windows, blocked storage); then nothing is
// remembered and each view opens on its default framing.

export interface GeoCamera {
  center: [number, number];
  zoom: number;
}

/** A d3-zoom transform: translate (x, y), then scale k. */
export interface NetworkCamera {
  x: number;
  y: number;
  k: number;
}

interface Saved {
  geo?: GeoCamera;
  network?: NetworkCamera;
}

const PREFIX = 'arthere:map-camera:';

function read(citySlug: string): Saved {
  try {
    const raw = sessionStorage.getItem(PREFIX + citySlug);
    return raw ? (JSON.parse(raw) as Saved) : {};
  } catch {
    return {};
  }
}

function write(citySlug: string, patch: Saved) {
  try {
    sessionStorage.setItem(PREFIX + citySlug, JSON.stringify({ ...read(citySlug), ...patch }));
  } catch {
    // Storage unavailable: the views just won't be remembered.
  }
}

export const loadGeoCamera = (citySlug: string) => read(citySlug).geo ?? null;
export const saveGeoCamera = (citySlug: string, geo: GeoCamera) => write(citySlug, { geo });
export const loadNetworkCamera = (citySlug: string) => read(citySlug).network ?? null;
export const saveNetworkCamera = (citySlug: string, network: NetworkCamera) => write(citySlug, { network });

/** Forget every city's map views — called when the visitor uses the nav bar. */
export function clearMapCameras() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Nothing stored, nothing to clear.
  }
}
