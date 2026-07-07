'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import Image from 'next/image';

export interface NetworkNode {
  id: string;
  label: string;
  type: 'artist' | 'place';
  /** Where clicking this node should go — an internal artist page, or an external place website. */
  href: string | null;
  /** True if `href` should open in a new tab (external sites). */
  external: boolean;
  imageUrl: string | null;
  /** Drives the node's color — artists and places in the same neighborhood share a color. */
  neighborhood: string | null;
  meta: string;
}

export interface NetworkLink {
  source: string;
  target: string;
}

interface SimNode extends NetworkNode, d3.SimulationNodeDatum {}
type SimLink = d3.SimulationLinkDatum<SimNode>;

// Each known neighborhood gets its own color from this palette (assigned in
// alphabetical order, for stability). Nodes with no neighborhood on file
// fall back to a neutral gray.
const PALETTE = d3.schemeTableau10;
const UNKNOWN_COLOR = '#6b6b6b';
const UNKNOWN_LABEL = 'Other';

// City-level strings that should not appear as filter options in the legend —
// they're too broad to be useful for neighborhood-level filtering.
const CITY_LEVEL = /^Portland(,?\s*(OR|Oregon))?$/i;

function getNeighborhoods(nodes: NetworkNode[]): string[] {
  return Array.from(
    new Set(
      nodes
        .map(n => n.neighborhood)
        .filter((n): n is string => !!n && !CITY_LEVEL.test(n))
    )
  ).sort();
}

function colorForNeighborhood(neighborhood: string | null, neighborhoods: string[]): string {
  if (!neighborhood) return UNKNOWN_COLOR;
  const i = neighborhoods.indexOf(neighborhood);
  if (i === -1) return UNKNOWN_COLOR;
  return PALETTE[i % PALETTE.length];
}

// Maps a neighborhood to the id of its <filter> (defined once in <defs>),
// which turns a photo grayscale and washes it with that neighborhood's color.
function filterIdForNeighborhood(neighborhood: string | null, neighborhoods: string[]): string {
  if (!neighborhood) return 'duotone-unknown';
  const i = neighborhoods.indexOf(neighborhood);
  if (i === -1) return 'duotone-unknown';
  return `duotone-${i}`;
}

interface Props {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface HoverState {
  node: NetworkNode;
  x: number;
  y: number;
}

/**
 * A dark, animated "map" of artists and the places they're connected to —
 * people are small circular photos, places are squares, and color shows
 * which neighborhood each one belongs to. Drag dots around, scroll/pinch to
 * zoom, hover for details, click to visit.
 */
export function NetworkGraph({ nodes, links }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [showArtists, setShowArtists] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [neighborhoodsOpen, setNeighborhoodsOpen] = useState(false);

  // Memoized so this array keeps the same identity across re-renders that
  // don't change the underlying data (e.g. every time the hover tooltip
  // updates) — otherwise the effect below (which sees `neighborhoods` as a
  // dependency) would think the data changed on every mouse movement and
  // tear down + rebuild the entire graph from scratch, causing the violent
  // "flip out" / restart-the-simulation behavior on hover.
  const neighborhoods = useMemo(() => getNeighborhoods(nodes), [nodes]);

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Artists visible when their type toggle is on and they match the selected area.
    const visibleArtists = new Set(
      nodes
        .filter(n => n.type === 'artist' && showArtists)
        .filter(n => selectedArea === null || n.neighborhood === selectedArea)
        .map(n => n.id)
    );

    // Places visible only when their type toggle is on AND they are linked to
    // at least one visible artist (or their own neighborhood matches).
    const visiblePlaces = new Set<string>();
    if (showPlaces) {
      for (const l of links) {
        const src = l.source as string;
        const tgt = l.target as string;
        if (visibleArtists.has(src)) visiblePlaces.add(tgt);
        if (visibleArtists.has(tgt)) visiblePlaces.add(src);
      }
      // Also include places whose own neighborhood matches the selected area.
      if (selectedArea !== null) {
        nodes
          .filter(n => n.type === 'place' && n.neighborhood === selectedArea)
          .forEach(n => visiblePlaces.add(n.id));
      }
    }

    const visibleNodes = nodes.filter(n =>
      n.type === 'artist' ? visibleArtists.has(n.id) : visiblePlaces.has(n.id)
    );
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = links.filter(l => visibleIds.has(l.source as string) && visibleIds.has(l.target as string));

    const simNodes: SimNode[] = visibleNodes.map(n => ({ ...n }));
    const idMap = new Map(simNodes.map(n => [n.id, n]));
    const simLinks: SimLink[] = visibleLinks
      .map(l => ({ source: idMap.get(l.source)!, target: idMap.get(l.target)! }))
      .filter(l => l.source && l.target);

    // Degree (connection count) drives node size, like the static prototype.
    const degree = new Map<string, number>();
    for (const l of visibleLinks) {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    }
    // Bigger than the original dots — big enough that a face photo reads.
    const radius = (n: SimNode) => {
      const d = degree.get(n.id) ?? 0;
      return n.type === 'artist' ? 18 + d * 2 : 16 + d * 1.5;
    };

    const svg = d3.select<SVGSVGElement, unknown>(svgEl);
    svg.selectAll('*').remove();

    // One "duotone" filter per neighborhood color: turns a photo grayscale,
    // then washes it with that color (plus one for nodes with no
    // neighborhood on file). Defined once and referenced by id, so the tint
    // is baked into each photo rather than layered on top with a blend mode
    // — the latter caused flicker/ghosting on moving nodes.
    const defs = svg.append('defs');
    const filterColors: [string, string][] = [
      ...neighborhoods.map((n, i): [string, string] => [`${i}`, colorForNeighborhood(n, neighborhoods)]),
      ['unknown', UNKNOWN_COLOR],
    ];
    for (const [key, color] of filterColors) {
      const filter = defs
        .append('filter')
        .attr('id', `duotone-${key}`)
        .attr('color-interpolation-filters', 'sRGB');
      filter.append('feColorMatrix').attr('type', 'saturate').attr('values', 0).attr('result', 'gray');
      filter.append('feFlood').attr('flood-color', color).attr('result', 'tint');
      filter.append('feBlend').attr('in', 'tint').attr('in2', 'gray').attr('mode', 'color');
    }

    const zoomG = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', e => zoomG.attr('transform', e.transform));
    svg.call(zoom);
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    });

    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .distance(l => {
            const source = l.source as SimNode;
            const target = l.target as SimNode;
            return source.type === 'artist' && target.type === 'artist' ? 170 : 130;
          })
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-380))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimNode>().radius(d => radius(d) + 20));

    const linkSel = zoomG
      .append('g')
      .attr('stroke', '#484848')
      .attr('stroke-opacity', 0.9)
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke-width', 1);

    const nodeSel = zoomG
      .append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .style('cursor', d => (d.href ? 'pointer' : 'default'))
      .style('opacity', 0)
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (e, d) => {
            if (!e.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (e, d) => {
            d.fx = e.x;
            d.fy = e.y;
          })
          .on('end', (e, d) => {
            if (!e.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_e, d) => {
        if (!d.href) return;
        if (d.external) window.open(d.href, '_blank', 'noopener,noreferrer');
        else window.location.href = d.href;
      })
      .on('mouseover', (e: MouseEvent, d) => setHover({ node: d, x: e.clientX, y: e.clientY }))
      .on('mousemove', (e: MouseEvent, d) => setHover({ node: d, x: e.clientX, y: e.clientY }))
      .on('mouseout', () => setHover(null));

    // Each node is a tinted "card": artists are circular photos, places are
    // square swatches. Both are colored by neighborhood — a soft color wash
    // over a photo if there is one, or a solid tint if there isn't.
    nodeSel.each(function (d) {
      const g = d3.select<SVGGElement, SimNode>(this);
      const r = radius(d);
      const size = r * 2;
      const color = colorForNeighborhood(d.neighborhood, neighborhoods);
      const filterId = filterIdForNeighborhood(d.neighborhood, neighborhoods);
      const imageUrl = d.imageUrl;
      const clipId = `node-clip-${d.id}`;

      if (d.type === 'artist') {
        if (imageUrl) {
          g.append('clipPath').attr('id', clipId).append('circle').attr('r', r);

          g.append('image')
            .attr('href', imageUrl)
            .attr('x', -r)
            .attr('y', -r)
            .attr('width', size)
            .attr('height', size)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .attr('clip-path', `url(#${clipId})`)
            .attr('filter', `url(#${filterId})`);
        } else {
          g.append('circle').attr('r', r).attr('fill', color).attr('fill-opacity', 0.85);
        }

        g.append('circle')
          .attr('r', r)
          .attr('fill', 'none')
          .attr('stroke', '#0a0a0a')
          .attr('stroke-width', 1.5);
      } else {
        // Places: rounded squares.
        if (imageUrl) {
          g.append('clipPath')
            .attr('id', clipId)
            .append('rect')
            .attr('x', -r)
            .attr('y', -r)
            .attr('width', size)
            .attr('height', size)
            .attr('rx', 4);

          g.append('image')
            .attr('href', imageUrl)
            .attr('x', -r)
            .attr('y', -r)
            .attr('width', size)
            .attr('height', size)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .attr('clip-path', `url(#${clipId})`)
            .attr('filter', `url(#${filterId})`);
        } else {
          g.append('rect')
            .attr('x', -r)
            .attr('y', -r)
            .attr('width', size)
            .attr('height', size)
            .attr('rx', 4)
            .attr('fill', color)
            .attr('fill-opacity', 0.85);
        }

        g.append('rect')
          .attr('x', -r)
          .attr('y', -r)
          .attr('width', size)
          .attr('height', size)
          .attr('rx', 4)
          .attr('fill', 'none')
          .attr('stroke', '#0a0a0a')
          .attr('stroke-width', 1.5);
      }
    });

    nodeSel
      .append('text')
      .attr('dy', d => radius(d) + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ddd')
      .attr('font-size', 11)
      .attr('font-family', 'Inter, -apple-system, sans-serif')
      .style('pointer-events', 'none')
      .text(d => d.label);

    nodeSel
      .transition()
      .duration(400)
      .delay((_d, i) => i * 30)
      .style('opacity', 1);

    sim.on('tick', () => {
      linkSel
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0);
      nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      sim.force('center', d3.forceCenter(w / 2, h / 2));
      sim.alpha(0.3).restart();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      sim.stop();
      resizeObserver.disconnect();
    };
  }, [nodes, links, showArtists, showPlaces, selectedArea, neighborhoods]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg ref={svgRef} className="block w-full h-full" />

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[#666] text-[0.9rem] px-5 text-center">
          No connections to show yet.
        </div>
      )}

      {/* Hover card */}
      {hover && (
        <div
          className="fixed z-50 pointer-events-none bg-[#111] border border-[#222] rounded-lg overflow-hidden w-[220px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          {hover.node.imageUrl && (
            <div className="relative w-full h-[100px] bg-[#1a1a1a]">
              <Image src={hover.node.imageUrl} alt="" fill sizes="220px" className="object-cover" />
            </div>
          )}
          <div className="p-3">
            <div className="font-heading text-[0.85rem] font-bold text-white mb-0.5">{hover.node.label}</div>
            {hover.node.meta && (
              <div className="flex items-center gap-1.5 text-[0.7rem] text-[#888] leading-snug">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: colorForNeighborhood(hover.node.neighborhood, neighborhoods) }}
                />
                {hover.node.meta}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls, bottom-left. Type toggles (Artists/Places) stay visible
          since there are only ever two — the neighborhood color key lives in
          its own expandable panel above, since that list keeps growing as
          more cities/neighborhoods are added. */}
      <div className="absolute bottom-4 left-4 z-10 text-[0.72rem]">
        {neighborhoodsOpen && (
          <div className="mb-2 w-[200px] max-h-[40vh] overflow-y-auto flex flex-col gap-2 bg-[#111]/95 backdrop-blur-sm border border-[#222] rounded-lg p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            {/* All — clears the area filter */}
            <button
              type="button"
              onClick={() => setSelectedArea(null)}
              className={`flex items-center gap-2 text-left transition-colors select-none cursor-pointer ${
                selectedArea === null ? 'text-[#bbb]' : 'text-[#555]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border flex-shrink-0 transition-colors"
                style={{
                  borderColor: selectedArea === null ? '#bbb' : '#555',
                  backgroundColor: selectedArea === null ? '#bbb' : 'transparent',
                }}
              />
              All
            </button>
            {neighborhoods.map(n => {
              const color = colorForNeighborhood(n, neighborhoods);
              const on = selectedArea === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelectedArea(on ? null : n)}
                  className={`flex items-center gap-2 text-left transition-colors select-none cursor-pointer ${
                    on ? 'text-[#bbb]' : 'text-[#555]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border flex-shrink-0 transition-colors"
                    style={{ borderColor: color, backgroundColor: on ? color : 'transparent' }}
                  />
                  {n}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setShowArtists(s => !s)}
            className={`flex items-center gap-2 transition-colors select-none cursor-pointer ${
              showArtists ? 'text-[#bbb]' : 'text-[#555]'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full border transition-colors"
              style={{
                borderColor: showArtists ? '#bbb' : '#555',
                backgroundColor: showArtists ? '#bbb' : 'transparent',
              }}
            />
            Artists
          </button>
          <button
            type="button"
            onClick={() => setShowPlaces(s => !s)}
            className={`flex items-center gap-2 transition-colors select-none cursor-pointer ${
              showPlaces ? 'text-[#bbb]' : 'text-[#555]'
            }`}
          >
            <span
              className="w-2.5 h-2.5 border transition-colors"
              style={{
                borderColor: showPlaces ? '#bbb' : '#555',
                backgroundColor: showPlaces ? '#bbb' : 'transparent',
              }}
            />
            Places
          </button>

          <span className="w-px h-3 bg-[#2a2a2a]" />

          <button
            type="button"
            onClick={() => setNeighborhoodsOpen(o => !o)}
            className="flex items-center gap-1.5 text-[#bbb] hover:text-white transition-colors select-none cursor-pointer"
          >
            {selectedArea ?? 'Areas'}
            {selectedArea !== null && (
              <span className="flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-[#333] text-[0.6rem] text-[#bbb]">
                1
              </span>
            )}
            <span
              className="text-[0.6rem] text-[#666] transition-transform duration-200"
              style={neighborhoodsOpen ? { transform: 'rotate(180deg)' } : undefined}
            >
              &#9650;
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
