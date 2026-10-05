'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PreviewCard } from '@/components/PreviewCard';
import { ZoomControls } from '@/components/ZoomControls';
import { isCityLevelNeighborhood } from '@/lib/neighborhoods';

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

function getNeighborhoods(nodes: NetworkNode[]): string[] {
  return Array.from(
    new Set(
      nodes
        .map(n => n.neighborhood)
        .filter((n): n is string => !!n && !isCityLevelNeighborhood(n))
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

export interface NeighborhoodOptionGroup {
  label: string | null;
  options: string[];
}

interface Props {
  nodes: NetworkNode[];
  links: NetworkLink[];
  /**
   * Neighborhood areas as arranged in /admin/neighborhoods. With the colour
   * key gone this only fixes the order colours are assigned in, so a given
   * neighborhood keeps the same colour run to run; falls back to alphabetical
   * when absent.
   */
  neighborhoodGroups?: NeighborhoodOptionGroup[];
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
export function NetworkGraph({ nodes, links, neighborhoodGroups }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Fits every node into view; assigned inside the effect, where the zoom
  // behaviour and the simulation's node list live.
  const resetRef = useRef<(() => void) | null>(null);
  // Zooms the graph about the middle of the screen, for the + / − buttons.
  const zoomByRef = useRef<((factor: number) => void) | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  // Memoized so this array keeps the same identity across re-renders that
  // don't change the underlying data (e.g. every time the hover tooltip
  // updates) — otherwise the effect below (which sees `neighborhoods` as a
  // dependency) would think the data changed on every mouse movement and
  // tear down + rebuild the entire graph from scratch, causing the violent
  // "flip out" / restart-the-simulation behavior on hover.
  const neighborhoods = useMemo(() => {
    const present = new Set(getNeighborhoods(nodes));
    if (!neighborhoodGroups) return [...present].sort();
    // Curated order first, then anything present but not yet filed.
    const ordered = neighborhoodGroups.flatMap(g => g.options).filter(n => present.has(n));
    const seen = new Set(ordered);
    return [...ordered, ...[...present].filter(n => !seen.has(n)).sort()];
  }, [nodes, neighborhoodGroups]);

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const svgBox = svgEl.getBoundingClientRect();
    const width = container.clientWidth || Math.round(svgBox.width) || 1000;
    const height = container.clientHeight || Math.round(svgBox.height) || 700;

    // No filtering: every node and link is drawn. The filter controls were
    // removed, so there is nothing to narrow by.
    const visibleNodes = nodes;
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
      const base = n.type === 'artist' ? 18 + d * 2 : 16 + d * 1.5;
      // Places without a page yet (a free-text venue, or one not in the
      // curated directory) are visually de-emphasized — much smaller than
      // places that actually link somewhere.
      if (n.type === 'place' && !n.href) return base * 0.25;
      return base;
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
      .scaleExtent([0.08, 4])
      .on('zoom', e => zoomG.attr('transform', e.transform));
    svg.call(zoom);
    svg.on('dblclick.zoom', () => {
      svg.call(zoom.transform, d3.zoomIdentity);
    });

    /**
     * Frame every node.
     *
     * Not zoomIdentity — that only returns the camera to its starting point,
     * which is no help once the layout itself has drifted wider than the
     * viewport. This measures where the nodes actually are and picks the
     * scale and offset that fit that box, so "all visible" is true regardless
     * of how far anything has wandered.
     */
    const fitToNodes = () => {
      // Measured from the live DOM, not from the simNodes array this closure
      // captured. In dev the effect can run more than once, and a reset that
      // measured its own captured array framed a set of nodes that were not
      // the ones on screen — it centred on the origin, where an un-ticked
      // simulation starts, and pushed the whole graph off to one side.
      //
      // getBBox on the zoom group also gives exactly the right box for free:
      // it is in simulation coordinates (the group's own transform is the
      // zoom, which getBBox excludes) and it already covers the labels, which
      // stick out well past the circles.
      const liveZoomG = svgEl.querySelector('g');
      if (!liveZoomG) return;

      let bb: DOMRect;
      try {
        bb = (liveZoomG as SVGGElement).getBBox();
      } catch {
        return; // getBBox throws if the element isn't rendered yet
      }
      if (bb.width === 0 || bb.height === 0) return;

      const box = svgEl.getBoundingClientRect();
      const w = Math.round(box.width) || width;
      const h = Math.round(box.height) || height;

      const PAD = 48;
      const boxW = bb.width + PAD * 2;
      const boxH = bb.height + PAD * 2;
      // Capped at 1: fitting should only zoom out to bring things into view,
      // never magnify. Uncapped, a tight cluster fits at the extent's 4x
      // maximum, which fills the screen with a couple of nodes and pushes the
      // rest off it.
      const k = Math.min(Math.max(Math.min(w / boxW, h / boxH), 0.08), 1);
      const cx = bb.x + bb.width / 2;
      const cy = bb.y + bb.height / 2;

      // Applied straight to the selection, not through svg.transition().
      // d3 transitions do not survive in this component — the force
      // simulation's per-tick work interrupts them, the same reason the node
      // enter animation had to be rewritten as a CSS transition. Routed
      // through a transition the zoom never moved at all.
      svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2 - k * cx, h / 2 - k * cy).scale(k));
    };

    // The tether's pull, per axis, shaped to the screen: on a wide screen the
    // vertical pull is the stronger, so the graph settles wide rather than
    // tall and fills the frame instead of being shrunk to fit its height.
    const tether = (w: number, h: number) => {
      const aspect = w / Math.max(1, h);
      return { x: 0.012 * Math.max(1, 1 / aspect), y: 0.012 * Math.max(1, aspect) };
    };

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
      // distanceMax matters: an uncapped many-body force has every node
      // repelling every other one at any separation, and forceCenter only
      // recentres the centroid — it applies no inward pull. Together those let
      // unconnected nodes drift apart indefinitely, which is why loners ended
      // up far out on their own and the layout grew wider than the viewport.
      .force('charge', d3.forceManyBody().strength(-380).distanceMax(700))
      .force('center', d3.forceCenter(width / 2, height / 2))
      // The tether that actually bounds things. Deliberately weak: it only
      // has to beat charge repulsion out at the fringe, where that force has
      // fallen off. Turned up to 0.055 it overwhelmed charge and collide at
      // close range too and collapsed the whole graph into one clump.
      .force('x', d3.forceX<SimNode>(width / 2).strength(tether(width, height).x))
      .force('y', d3.forceY<SimNode>(height / 2).strength(tether(width, height).y))
      .force('collide', d3.forceCollide<SimNode>().radius(d => radius(d) + 20));

    // Frame every node — what Reset view does. The first view is framed the
    // same way, once the layout has settled (below).
    // Straight to the selection rather than through a transition, for the
    // same reason as fitToNodes above.
    zoomByRef.current = (factor) => svg.call(zoom.scaleBy, factor);

    resetRef.current = () => {
      for (const n of simNodes) {
        n.fx = null;
        n.fy = null;
      }
      fitToNodes();
    };

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
      .style('transition', 'opacity 400ms ease')
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
      // Only nodes with a page of their own get a hover card. A place without
      // one is just its name, already printed beside the dot — and a card
      // would show whatever photo the record happens to hold for a place
      // that isn't public.
      .on('mouseover', (e: MouseEvent, d) => d.href && setHover({ node: d, x: e.clientX, y: e.clientY }))
      .on('mousemove', (e: MouseEvent, d) => d.href && setHover({ node: d, x: e.clientX, y: e.clientY }))
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

    // Fade in via plain setTimeout + CSS transition rather than d3's own
    // `.transition()` — the latter is a JS-timer-driven animation that was
    // observed getting silently interrupted a few dozen ms in (every node
    // past the first one or two staggered slots stayed stuck at opacity 0
    // forever, no console error) once the force simulation's per-tick DOM
    // writes started competing for the same timer queue. A native CSS
    // transition triggered by a plain timeout sidesteps that entirely.
    const fadeInTimers: ReturnType<typeof setTimeout>[] = [];
    nodeSel.nodes().forEach((el, i) => {
      fadeInTimers.push(setTimeout(() => { el.style.opacity = '1'; }, i * 30));
    });

    const draw = () => {
      linkSel
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0);
      nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    };
    sim.on('tick', draw);

    // Settle the layout before anyone sees it, then frame it once. Letting
    // it settle on screen and framing it afterwards (it used to, on a 2.2s
    // timer) showed a full-size graph that then abruptly zoomed out. Only
    // dragging a node runs the simulation live now.
    sim.stop();
    const settleTicks = Math.ceil(Math.log(sim.alphaMin()) / Math.log(1 - sim.alphaDecay()));
    for (let i = 0; i < settleTicks; i++) sim.tick();
    draw();
    fitToNodes();

    // A real resize re-frames the graph where it stands. The observer also
    // reports once when it starts watching — that's the size the layout was
    // just framed for, so it's skipped.
    let observedOnce = false;
    const resizeObserver = new ResizeObserver(() => {
      if (!observedOnce) {
        observedOnce = true;
        return;
      }
      fitToNodes();
    });
    resizeObserver.observe(container);

    return () => {
      sim.stop();
      resizeObserver.disconnect();
      fadeInTimers.forEach(clearTimeout);
    };
  }, [nodes, links, neighborhoods]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg ref={svgRef} className="block w-full h-full" />

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[#666] text-[0.9rem] px-5 text-center">
          No connections to show yet.
        </div>
      )}

      {/* Hover card — shared with the map tab's Geographic view. */}
      {hover && (
        <PreviewCard
          variant={hover.node.type}
          label={hover.node.label}
          meta={hover.node.meta}
          imageUrl={hover.node.imageUrl}
          x={hover.x}
          y={hover.y}
        />
      )}

      {/* Zoom buttons, then Reset, in the bottom-right corner. Reset frames
          every node — the way back from having dragged or zoomed somewhere
          unrecoverable. */}
      <div className="absolute bottom-5 right-5 z-10 flex flex-col items-end gap-2">
        <ZoomControls onZoomIn={() => zoomByRef.current?.(1.4)} onZoomOut={() => zoomByRef.current?.(1 / 1.4)} />
        <button
          type="button"
          onClick={() => resetRef.current?.()}
          className="px-2.5 py-1 rounded-md border border-[#444] text-[0.72rem] text-[#888] bg-[#0a0a0a]/80 hover:border-[#888] hover:text-[#ccc] transition-colors cursor-pointer"
        >
          Reset view
        </button>
      </div>

    </div>
  );
}
