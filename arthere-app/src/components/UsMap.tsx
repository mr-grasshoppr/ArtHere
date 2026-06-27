'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

interface CityDef {
  code: string;
  lat: number;
  lon: number;
  active: boolean;
  tooltip: string[];
}

const CITIES: CityDef[] = [
  {
    code: 'Portland',
    lat: 45.52,
    lon: -122.68,
    active: true,
    tooltip: ['Launching Summer 2026', 'Find us at Multnomah Days, August 15!'],
  },
  {
    code: 'San Jose',
    lat: 37.34,
    lon: -121.89,
    active: false,
    tooltip: ['Coming soon'],
  },
  {
    code: 'Biloxi',
    lat: 30.39,
    lon: -88.89,
    active: false,
    tooltip: ['Coming soon'],
  },
];

export function UsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; lines: string[] } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const W = container.clientWidth || 700;
    const H = Math.round(W * 0.62);

    const projection = d3
      .geoAlbersUsa()
      .scale(W * 1.25)
      .translate([W / 2, H / 2]);

    const pathGen = d3.geoPath().projection(projection);

    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => r.json())
      .then((topo: Topology) => {
        const states = feature(topo, topo.objects.states as any);

        const root = d3.select(svg);
        root.selectAll('*').remove();
        root.attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H);

        // State fills
        root
          .append('g')
          .selectAll('path')
          .data((states as any).features)
          .join('path')
          .attr('d', pathGen as any)
          .attr('fill', '#eeede9')
          .attr('stroke', 'none');


        // City markers
        CITIES.forEach(city => {
          const proj = projection([city.lon, city.lat]);
          if (!proj) return;
          const [cx, cy] = proj;

          const g = root.append('g').style('cursor', 'default');

          // Outer ring for active city
          if (city.active) {
            g.append('circle')
              .attr('cx', cx).attr('cy', cy).attr('r', 13)
              .attr('fill', 'none')
              .attr('stroke', '#1a1a1a')
              .attr('stroke-width', 1)
              .attr('opacity', 0.18);
          }

          // Dot
          g.append('circle')
            .attr('class', 'dot')
            .attr('cx', cx).attr('cy', cy)
            .attr('r', city.active ? 5.5 : 4.5)
            .attr('fill', city.active ? '#1a1a1a' : '#b8b4ae');

          // City name label — anchor right of dot for west-coast cities to avoid clipping
          const isWestCoast = city.lon < -100;
          g.append('text')
            .attr('x', isWestCoast ? cx + 8 : cx)
            .attr('y', cy + (city.active ? 4 : 3))
            .attr('text-anchor', isWestCoast ? 'start' : 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-family', 'var(--font-nunito), Arial Rounded MT Bold, Arial, sans-serif')
            .attr('font-size', city.active ? 11 : 9.5)
            .attr('font-weight', city.active ? '700' : '600')
            .attr('letter-spacing', '0.02em')
            .attr('fill', city.active ? '#1a1a1a' : '#aaa')
            .text(city.code);

          // Invisible hover target
          g.append('circle')
            .attr('cx', cx).attr('cy', cy).attr('r', 18)
            .attr('fill', 'transparent')
            .on('mouseenter', () => setTip({ x: cx, y: cy, lines: city.tooltip }))
            .on('mouseleave', () => setTip(null));
        });
      })
      .catch(err => console.error('US map load failed:', err));
  }, []);

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg ref={svgRef} className="w-full block" />
      {tip && containerRef.current && svgRef.current && (
        <div
          className="absolute z-10 pointer-events-none bg-[#1a1a1a] text-white rounded-md px-3 py-2 text-[0.78rem] leading-[1.55] whitespace-nowrap"
          style={{
            left: `${(tip.x / (svgRef.current.clientWidth || 700)) * 100}%`,
            top: `${(tip.y / (svgRef.current.clientHeight || 434)) * 100}%`,
            transform: 'translate(10px, -50%)',
          }}
        >
          {tip.lines.map((l, i) => (
            <div key={i} className={i === 0 ? 'font-semibold' : 'opacity-80'}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
