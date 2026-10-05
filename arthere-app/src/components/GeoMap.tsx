'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PreviewCard } from '@/components/PreviewCard';
import { MapRegionPanel } from '@/components/MapRegionPanel';
import { ZoomControls } from '@/components/ZoomControls';
import {
  PLACE_PIN_COLOR,
  REGION_COLOR,
  REGION_HOVER_COLOR,
  REGION_SELECTED_COLOR,
  type MapRegionFeature,
} from '@/lib/map-regions';
import type { GeoMapData, MapPin } from '@/lib/map-data';
import { layoutCallouts } from '@/lib/pin-callouts';

// OpenFreeMap: free vector tiles with no API key or usage cap. Overridable so
// a Mapbox/MapTiler style can be swapped in without a code change.
const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/dark';
const PAGE_BG = '#0a0a0a';
const WATER = '#1d2b3a';
// Below this the map is an overview — quadrants, cities, rivers, freeways;
// at and above it, neighborhoods and the full street map.
const DETAIL_ZOOM = 11.5;
// How far out you can zoom: a little past the whole metro, not the whole
// Pacific Northwest — out there the map has nothing to show.
const MIN_ZOOM = 8;
// Below this the metro is too small on screen for its quadrant and city
// names to fit; the shapes stay, the names go.
const LABEL_MIN_ZOOM = 9;

// Pin size by zoom, as [zoom, px] stops — drawn by the map layer and used to
// work out how far apart pins must sit so they never overlap.
const PIN_RADIUS: [number, number][] = [[9, 3], [12, 4.5], [16, 7]];
const PIN_STROKE: [number, number][] = [[9, 0.5], [13, 1], [16, 1.5]];
// Clear space between neighboring pins, on top of their own size.
const PIN_GAP = 4;
// Call-outs: leader lines and the small points marking each lifted pin's
// real spot, light gray and drawn under the pins.
const CALLOUT_COLOR = '#8a8a8a';

const stopsExpression = (stops: [number, number][]) =>
  ['interpolate', ['linear'], ['zoom'], ...stops.flat()] as maplibregl.ExpressionSpecification;

function atZoom(stops: [number, number][], zoom: number): number {
  if (zoom <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [z1, v1] = stops[i];
    if (zoom <= z1) {
      const [z0, v0] = stops[i - 1];
      return v0 + ((v1 - v0) * (zoom - z0)) / (z1 - z0);
    }
  }
  return stops[stops.length - 1][1];
}

// Basemap layers the overview keeps. Everything else — minor roads, labels,
// buildings, parks, rail, freeway casings — only appears from DETAIL_ZOOM.
const OVERVIEW_LAYERS = new Set(['background', 'water', 'waterway', 'highway_motorway_inner', 'highway_motorway_subtle']);

/**
 * Pares the stock dark style down for the overview and adjusts it to the
 * site: page-black background, rivers a readable slate blue, freeways a
 * single fine grey line with no shields or names, and — zoomed in — streets
 * and street names lifted enough to read, since that's where a pin click
 * lands.
 */
function simplifyBasemap(map: maplibregl.Map) {
  for (const layer of map.getStyle().layers) {
    if (OVERVIEW_LAYERS.has(layer.id)) continue;
    map.setLayerZoomRange(layer.id, Math.max(layer.minzoom ?? 0, DETAIL_ZOOM), layer.maxzoom ?? 24);
  }
  const paint = (layer: string, prop: string, value: unknown) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop, value);
  };
  paint('background', 'background-color', PAGE_BG);
  paint('water', 'fill-color', WATER);
  paint('waterway', 'line-color', WATER);
  paint('waterway', 'line-width', ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1.2]);
  paint('highway_motorway_inner', 'line-color', '#4d4d4d');
  paint('highway_motorway_inner', 'line-width', ['interpolate', ['linear'], ['zoom'], 6, 0.4, 10, 0.8, 13, 1.6, 16, 4, 20, 10]);
  paint('highway_motorway_subtle', 'line-color', '#3d3d3d');
  paint('highway_motorway_subtle', 'line-width', 0.5);
  paint('highway_motorway_casing', 'line-color', '#262626');
  paint('highway_minor', 'line-color', '#2a2a2a');
  paint('highway_major_inner', 'line-color', '#2e2e2e');
  paint('highway_name_other', 'text-color', '#9a9a9a');
  paint('highway_name_motorway', 'text-color', '#8a8a8a');
}

interface Props extends GeoMapData {
  citySlug: string;
  /** "Portland" — for the panel's "See all artwork around Portland" tile. */
  cityName: string;
  /** Centered over the top of the map area (the page's view switch), so an open panel never sits under it. */
  topControl?: ReactNode;
}

type RegionHover = { name: string; count: number; x: number; y: number };
type PlaceHover = { pin: MapPin; x: number; y: number };
type Selected = { id: string; name: string };

/**
 * The map tab's Geographic view. Zoomed out it's deliberately spare —
 * Portland's quadrants and the satellite cities, all one neutral, labeled,
 * over rivers and freeways; zoomed in it becomes neighborhoods over a full
 * street map. Hovering a region lights it up; clicking one opens a side panel
 * of its opted-in artists or their artwork. A pink pin marks each location of
 * every opted-in place.
 *
 * Draws whatever polygons src/data/map-regions.json holds — it has no idea
 * which cities exist or how finely they're divided, so subdividing a
 * satellite city later is a data change (see scripts/build-map-regions.mts).
 */
export function GeoMap({ citySlug, cityName, regionStats, artists, pins, topControl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [regionHover, setRegionHover] = useState<RegionHover | null>(null);
  const [placeHover, setPlaceHover] = useState<PlaceHover | null>(null);
  // A pin's card pinned open by a click — stays put after the pointer leaves.
  const [stickyPin, setStickyPin] = useState<PlaceHover | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const labelsRef = useRef(new Map<string, maplibregl.Marker>());
  // The map's own handlers outlive renders, so they call back through a ref.
  const selectRef = useRef<(s: Selected | null) => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    const labels = labelsRef.current;

    const map = new maplibregl.Map({
      container,
      style: STYLE_URL,
      center: [-122.66, 45.5],
      zoom: 10,
      minZoom: MIN_ZOOM,
      attributionControl: false,
    });
    mapRef.current = map;

    // Fetched alongside the style rather than after it, and layers go on at
    // 'style.load' rather than 'load': 'load' waits for every basemap tile,
    // which left the map blank for seconds on a slow connection.
    const regionsPromise = import('@/data/map-regions.json').then(
      (m) => m.default as unknown as { attribution: string; features: MapRegionFeature[] }
    );

    // Hovered and selected regions, and their labels, which flip to dark
    // text on the light chartreuse.
    let hoveredId: string | undefined;
    let selectedId: string | undefined;
    const setRegionState = (id: string | undefined, state: { hover?: boolean; selected?: boolean }) => {
      if (!id) return;
      if (map.getSource('regions')) map.setFeatureState({ source: 'regions', id }, state);
      const next = map.getFeatureState({ source: 'regions', id });
      const el = labels.get(id)?.getElement();
      if (el) el.style.color = next.hover || next.selected ? PAGE_BG : '#ffffff';
    };

    map.once('style.load', async () => {
      const regions = await regionsPromise;
      if (cancelled) return;

      map.addControl(
        new maplibregl.AttributionControl({ compact: true, customAttribution: regions.attribution }),
        // Bottom-left: the zoom buttons have the bottom-right corner.
        'bottom-left'
      );
      // Compact attribution starts expanded on narrow screens, where it
      // covers a third of the map; start it folded to its (i) button.
      container.querySelector('.maplibregl-compact-show')?.classList.remove('maplibregl-compact-show');

      simplifyBasemap(map);

      map.addSource('regions', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: regions.features },
        promoteId: 'id',
      });

      const regionColor: maplibregl.ExpressionSpecification = [
        'case',
        ['boolean', ['feature-state', 'selected'], false], REGION_SELECTED_COLOR,
        ['boolean', ['feature-state', 'hover'], false], REGION_HOVER_COLOR,
        REGION_COLOR,
      ];
      const lit: maplibregl.ExpressionSpecification = [
        'any',
        ['boolean', ['feature-state', 'hover'], false],
        ['boolean', ['feature-state', 'selected'], false],
      ];
      // Under the water, so rivers run over the shapes as on a paper map.
      const beforeWater = map.getLayer('water') ? 'water' : undefined;

      // Zoomed out: Portland's quadrants and the satellite cities, and
      // nothing else competing with them.
      map.addLayer(
        {
          id: 'overview-fill',
          type: 'fill',
          source: 'regions',
          maxzoom: DETAIL_ZOOM,
          filter: ['in', ['get', 'level'], ['literal', ['area', 'city', 'community']]],
          paint: { 'fill-color': regionColor },
        },
        beforeWater
      );
      // Hairline gaps between shapes, in the page background.
      map.addLayer({
        id: 'overview-line',
        type: 'line',
        source: 'regions',
        maxzoom: DETAIL_ZOOM,
        filter: ['in', ['get', 'level'], ['literal', ['area', 'city', 'community']]],
        paint: { 'line-color': PAGE_BG, 'line-width': 0.75 },
      });

      // Zoomed in: neighborhoods (the satellite cities stay whole), light
      // enough that the street map reads through them.
      map.addLayer(
        {
          id: 'detail-fill',
          type: 'fill',
          source: 'regions',
          minzoom: DETAIL_ZOOM,
          filter: ['in', ['get', 'level'], ['literal', ['neighborhood', 'city', 'community']]],
          paint: {
            'fill-color': regionColor,
            'fill-opacity': [
              'interpolate', ['linear'], ['zoom'],
              DETAIL_ZOOM, ['case', lit, 0.75, 0.6],
              15, ['case', lit, 0.4, 0.2],
            ],
          },
        },
        beforeWater
      );
      map.addLayer({
        id: 'detail-line',
        type: 'line',
        source: 'regions',
        minzoom: DETAIL_ZOOM,
        filter: ['in', ['get', 'level'], ['literal', ['neighborhood', 'city', 'community']]],
        paint: { 'line-color': '#3a3a3a', 'line-width': 0.5 },
      });

      map.addSource('places', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: pins.map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            properties: { id: p.id },
          })),
        },
      });
      const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
      map.addSource('place-legs', { type: 'geojson', data: empty });
      map.addSource('place-anchors', { type: 'geojson', data: empty });
      map.addLayer({
        id: 'places-legs',
        type: 'line',
        source: 'place-legs',
        paint: { 'line-color': CALLOUT_COLOR, 'line-width': 0.75, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'places-anchor',
        type: 'circle',
        source: 'place-anchors',
        paint: { 'circle-color': CALLOUT_COLOR, 'circle-radius': 1.75 },
      });
      map.addLayer({
        id: 'places-pin',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-color': PLACE_PIN_COLOR,
          'circle-radius': stopsExpression(PIN_RADIUS),
          'circle-stroke-color': PAGE_BG,
          'circle-stroke-width': stopsExpression(PIN_STROKE),
        },
      });

      // Quadrant and city names, in the site's display face. HTML markers
      // rather than a symbol layer so they can use Bebas Neue, which the
      // tile server's font stack doesn't have.
      for (const f of regions.features) {
        const { id, labelPoint, shortName, level } = f.properties;
        if (!labelPoint || !shortName) continue;
        const el = document.createElement('div');
        el.textContent = shortName;
        el.dataset.level = level;
        Object.assign(el.style, {
          fontFamily: 'var(--font-bebas), sans-serif',
          letterSpacing: level === 'area' ? '0.02em' : '0.06em',
          lineHeight: '1',
          color: '#ffffff',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          transition: 'color 120ms',
        });
        labels.set(id, new maplibregl.Marker({ element: el }).setLngLat(labelPoint).addTo(map));
      }
      syncLabels();

      // Frame every drawn region — Vancouver to Tigard — on first load.
      const bounds = new maplibregl.LngLatBounds();
      for (const f of regions.features) {
        const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        for (const poly of polys) for (const [lng, lat] of poly[0]) bounds.extend([lng, lat]);
      }
      // Leave room for the legend card, which floats bottom-left on desktop.
      const wide = container.clientWidth >= 768;
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: wide ? { top: 64, bottom: 24, left: 250, right: 24 } : 24, duration: 0 });
      }
      layoutPins();
    });

    // Pins never overlap. Any that would touch on screen become call-outs:
    // nudged just clear, as close to their real spots as they can sit, each
    // joined to its spot (a small gray point) by a short leader line. Zoomed
    // in far enough that they have room, every pin sits on its own spot with
    // no line — the moment two pins stop touching, their lines go. Only zoom
    // changes their spacing on screen (panning moves them all together), so
    // this reruns on zoom, at most once a frame, each time starting from
    // where the last frame left the pins so they glide rather than re-settle
    // (see pin-callouts.ts).
    let pinOffsets: { x: number; y: number }[] | undefined;
    function layoutPins() {
      const pinSource = map.getSource('places') as maplibregl.GeoJSONSource | undefined;
      const legSource = map.getSource('place-legs') as maplibregl.GeoJSONSource | undefined;
      const anchorSource = map.getSource('place-anchors') as maplibregl.GeoJSONSource | undefined;
      if (!pinSource || !legSource || !anchorSource) return;
      const zoom = map.getZoom();
      // Pins touch edge to edge at `touch`; lifted pins also keep a gap.
      const touch = 2 * (atZoom(PIN_RADIUS, zoom) + atZoom(PIN_STROKE, zoom));
      const { positions, anchors, offsets } = layoutCallouts(
        pins.map((p) => map.project([p.lng, p.lat])),
        touch + PIN_GAP,
        touch,
        pinOffsets
      );
      // Carried into the next zoom step, so pins glide rather than re-settle.
      pinOffsets = offsets;
      const drawn = positions.map(({ x, y }): [number, number] => {
        const { lng, lat } = map.unproject([x, y]);
        return [lng, lat];
      });
      pinSource.setData({
        type: 'FeatureCollection',
        features: pins.map((p, i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: drawn[i] },
          properties: { id: p.id },
        })),
      });
      // Lines and spot markers run from each lifted pin's true location.
      const lifted = pins.flatMap((p, i) => (anchors[i] ? [{ spot: [p.lng, p.lat] as [number, number], pin: drawn[i] }] : []));
      legSource.setData({
        type: 'FeatureCollection',
        features: lifted.map(({ spot, pin }) => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [spot, pin] },
          properties: {},
        })),
      });
      anchorSource.setData({
        type: 'FeatureCollection',
        features: lifted.map(({ spot }) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: spot },
          properties: {},
        })),
      });
    }
    let pinFrame = 0;
    map.on('zoom', () => {
      if (pinFrame) return;
      pinFrame = requestAnimationFrame(() => {
        pinFrame = 0;
        layoutPins();
      });
    });

    // ─── Regions: hover lights one up; click opens its panel ─────────────────
    // The two fill layers never overlap in zoom, so one handler serves both.
    const FILL_LAYERS = ['overview-fill', 'detail-fill'];
    const clearRegionHover = () => {
      setRegionState(hoveredId, { hover: false });
      hoveredId = undefined;
      setRegionHover(null);
    };
    map.on('mousemove', FILL_LAYERS, (e) => {
      // A pin sits on top of a region; let the pin's own card win.
      if (map.queryRenderedFeatures(e.point, { layers: ['places-pin'] }).length > 0) return clearRegionHover();
      const f = e.features?.[0];
      if (!f) return;
      const id = String(f.properties.id);
      if (hoveredId !== id) {
        setRegionState(hoveredId, { hover: false });
        hoveredId = id;
        setRegionState(hoveredId, { hover: true });
      }
      map.getCanvas().style.cursor = 'pointer';
      setRegionHover({
        name: String(f.properties.name),
        count: regionStats[id]?.count ?? 0,
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
      });
    });
    map.on('mouseleave', FILL_LAYERS, () => {
      map.getCanvas().style.cursor = '';
      clearRegionHover();
    });
    map.on('click', FILL_LAYERS, (e) => {
      if (map.queryRenderedFeatures(e.point, { layers: ['places-pin'] }).length > 0) return;
      const f = e.features?.[0];
      if (!f) return;
      clearRegionHover();
      selectRef.current({ id: String(f.properties.id), name: String(f.properties.name) });
      // The panel opening narrows the map; once it has, bring the spot that
      // was clicked to the middle of what's left so it isn't pushed aside.
      const target = e.lngLat;
      requestAnimationFrame(() => {
        map.resize();
        map.easeTo({ center: target, duration: 500 });
      });
    });
    selectRef.current = (next) => {
      setRegionState(selectedId, { selected: false });
      selectedId = next?.id;
      setRegionState(selectedId, { selected: true });
      setSelected(next);
    };

    // Quadrant and city names belong to the zoomed-out view only, and grow
    // and shrink with it so they fit their shapes on a phone and a monitor.
    const syncLabels = () => {
      const zoom = map.getZoom();
      const show = zoom >= LABEL_MIN_ZOOM && zoom < DETAIL_ZOOM;
      const scale = 2 ** (zoom - 10.5);
      for (const m of labels.values()) {
        const el = m.getElement();
        el.style.display = show ? '' : 'none';
        const base = el.dataset.level === 'area' ? 44 : 18;
        el.style.fontSize = `${Math.round(Math.min(Math.max(base * scale, base / 3.5), base * 1.3))}px`;
      }
    };
    map.on('zoom', syncLabels);
    // Scrolling or dragging the map doesn't move the pointer, so a card
    // would otherwise sit there describing whatever used to be under it.
    map.on('movestart', () => {
      clearRegionHover();
      setPlaceHover(null);
      clearSticky();
    });

    // ─── Places: hover shows the shared preview card. One click pins the card
    // open; a second click on the same pin opens the place's page — on a
    // phone, tap to see, tap again to go. Clicking anywhere else, or moving
    // the map, lets go of it.
    const pinById = new Map(pins.map((p) => [p.id, p]));
    let stickyId: string | undefined;
    function clearSticky() {
      stickyId = undefined;
      setStickyPin(null);
    }
    map.on('mousemove', 'places-pin', (e) => {
      const pin = pinById.get(String(e.features?.[0]?.properties.id));
      if (!pin) return;
      map.getCanvas().style.cursor = 'pointer';
      setPlaceHover({ pin, x: e.originalEvent.clientX, y: e.originalEvent.clientY });
    });
    map.on('mouseleave', 'places-pin', () => {
      map.getCanvas().style.cursor = '';
      setPlaceHover(null);
    });
    map.on('click', (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: ['places-pin'] })[0];
      const pin = hit && pinById.get(String(hit.properties.id));
      if (!pin) return clearSticky();
      if (stickyId === pin.id) {
        if (pin.href) window.location.href = pin.href;
        return;
      }
      clearRegionHover();
      setPlaceHover(null);
      stickyId = pin.id;
      setStickyPin({ pin, x: e.originalEvent.clientX, y: e.originalEvent.clientY });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(pinFrame);
      labels.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [citySlug, regionStats, pins]);

  // Hovering another pin previews it over a pinned-open card.
  const shownPin = placeHover ?? stickyPin;
  const selectedArtists = selected ? artists.filter((a) => a.regionIds.includes(selected.id)) : [];
  const selectedNames = selected ? regionStats[selected.id]?.names ?? [] : [];
  const directoryHref =
    selectedNames.length > 0
      ? `/cities/${citySlug}/artists?${new URLSearchParams(selectedNames.map((n) => ['neighborhood', n]))}`
      : null;

  return (
    // An open panel takes its own share of the screen and the map narrows
    // (or, on a phone, shortens) to make room — maplibre notices the
    // container resize and redraws, keeping its center.
    <div className="absolute inset-0 flex flex-col md:flex-row">
      {/* Sizing lives on a wrapper: maplibre's stylesheet forces
          position:relative on the map container itself. */}
      <div className="relative flex-1 min-h-0 min-w-0">
        <div className="absolute inset-0">
          <div ref={containerRef} className="w-full h-full" />
        </div>
        {topControl && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">{topControl}</div>}
        <div className="absolute bottom-5 right-5 z-20">
          <ZoomControls onZoomIn={() => mapRef.current?.zoomIn()} onZoomOut={() => mapRef.current?.zoomOut()} />
        </div>
      </div>

      {shownPin ? (
        <PreviewCard
          variant="place"
          label={shownPin.pin.name}
          meta={shownPin.pin.subtitle}
          imageUrl={shownPin.pin.imageUrl}
          x={shownPin.x}
          y={shownPin.y}
          // Only the pinned-open place's card is clickable — not a hover
          // preview of some other pin passing over it.
          href={stickyPin && shownPin.pin.id === stickyPin.pin.id ? stickyPin.pin.href : null}
        />
      ) : regionHover ? (
        <div
          className="fixed z-50 pointer-events-none bg-[#111] border border-[#222] rounded-lg px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          style={{ left: regionHover.x + 14, top: regionHover.y + 14 }}
        >
          <div className="font-heading text-[0.8rem] font-bold text-white leading-tight">{regionHover.name}</div>
          <div className="text-[0.68rem] text-[#888] leading-snug mt-0.5">
            {regionHover.count === 0
              ? 'Featured artists coming soon!'
              : 'Click to see local art'}
          </div>
        </div>
      ) : null}

      {/* The region panel: a column down the right on wider screens; on a
          phone, a strip across the bottom 30% that scrolls sideways. A
          region with nobody in it only has a line of text to show, so its
          panel shrinks to fit it — a short strip on a phone, a small card
          over the map's corner on wider screens. */}
      {selected && (
        <div
          className={
            selectedArtists.length === 0
              ? 'flex-shrink-0 border-t border-[#222] md:absolute md:top-16 md:right-4 md:z-30 md:w-[300px] md:rounded-lg md:border md:overflow-hidden md:shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
              : 'flex-shrink-0 h-[30%] min-h-[190px] md:h-full md:min-h-0 md:w-[360px] border-t md:border-t-0 md:border-l border-[#222]'
          }
        >
          <MapRegionPanel
            key={selected.id}
            name={selected.name}
            artists={selectedArtists}
            directoryHref={directoryHref}
            artworkHref={`/cities/${citySlug}?browse`}
            artistsHref={`/cities/${citySlug}/artists`}
            cityName={cityName}
            onClose={() => selectRef.current(null)}
          />
        </div>
      )}
    </div>
  );
}
