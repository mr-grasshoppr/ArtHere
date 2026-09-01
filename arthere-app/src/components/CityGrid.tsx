'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './CityGrid.module.css';
import { buildSpacedSequence, type RepeatItem } from '@/lib/grid-sequence';
import { GRID_REPEATS, GRID_MIN_ROW_GAP, CITY_LOGO_CELL } from '@/lib/grid-design';
import { focalStyle, type Focal } from '@/lib/focal-style';

export interface ArtistGridData {
  url: string;   // e.g. /artists/kurtis-piltz
  name: string;
  /** focal — same framing/crop the artist profile page uses for this image. */
  images: { src: string; focal?: Focal | null; isHero: boolean }[];
}

interface Props {
  artists: ArtistGridData[];
  overlayImageUrl: string;
  maskImageUrl: string;
}

const GAP = 5;

interface SequenceItem {
  src: string;
  focal?: Focal | null;
  tall: boolean;
  url: string;
  name: string;
}

function buildSequence(artists: ArtistGridData[], cols: number): SequenceItem[] {
  const items: RepeatItem<SequenceItem>[] = artists.flatMap(artist =>
    artist.images.map(img => ({
      // Two identities: the artist (so two different pieces by one artist
      // can't crowd each other) and the piece itself (so a single image
      // never repeats near itself, even in a city with few artists).
      key: artist.url,
      id: img.src,
      // Hero images render as tall (2-row) cells; the planner needs the span
      // so its spacing is measured against real placement.
      span: img.isHero ? 2 : 1,
      payload: { src: img.src, focal: img.focal, tall: img.isHero, url: artist.url, name: artist.name },
    }))
  );
  return buildSpacedSequence(items, {
    cols,
    repeats: GRID_REPEATS,
    minRowGap: GRID_MIN_ROW_GAP,
    // sequence[0] is rendered below as the 2-col x 2-row logo cell. The
    // planner has to model that footprint or every row boundary after it
    // drifts from the one the browser actually lays out.
    leadCell: CITY_LOGO_CELL,
  });
}

interface GridLayout {
  cols: number;
  col: number;
  row: number;
  sequence: SequenceItem[];
}

/**
 * Full-screen ambient artwork grid for city pages. Auto-scrolls upward via a
 * CSS animation; clicking/tapping (or Space) freezes it in place and turns
 * the cells into links, Escape or the resume button restarts it. Rendered
 * declaratively — layout lives in state, not hand-built DOM.
 */
export function CityGrid({ artists, overlayImageUrl, maskImageUrl }: Props) {
  const vpRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<GridLayout | null>(null);
  const [frozen, setFrozen] = useState(false);
  const frozenRef = useRef(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // (Re)build the randomized layout — on mount, on resume, and on resize.
  // Runs client-side only so the random order can't cause a hydration
  // mismatch (first render shows an empty track).
  const buildGrid = useCallback(() => {
    frozenRef.current = false;
    setFrozen(false);

    const cols = window.innerWidth < 500 ? 3 : 4;
    const col = Math.floor((window.innerWidth - GAP * (cols + 1)) / cols);
    setLayout({ cols, col, row: col, sequence: buildSequence(artists, cols) });

    const vp = vpRef.current;
    if (vp) vp.scrollTop = 0;
  }, [artists]);

  useEffect(() => {
    // Building in a mount effect is deliberate: the randomized layout must
    // be produced client-side so it can't cause a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buildGrid();
  }, [buildGrid]);

  const freeze = useCallback(() => {
    if (frozenRef.current) return;
    const track = trackRef.current;
    const vp = vpRef.current;
    if (!track || !vp) return;

    frozenRef.current = true;

    // Capture the current mid-animation Y offset from the CSS transform
    // matrix, then switch to native scrolling at that same position.
    const matrix = window.getComputedStyle(track).transform;
    let currentY = 0;
    if (matrix && matrix !== 'none') {
      const match = matrix.match(/matrix.*\((.+)\)/);
      if (match) currentY = parseFloat(match[1].split(', ')[5]) || 0;
    }

    setFrozen(true);
    // Set scrollTop after React applies the frozen styles.
    requestAnimationFrame(() => {
      if (vpRef.current) vpRef.current.scrollTop = Math.max(0, -currentY);
    });
  }, []);

  const resume = useCallback(() => {
    if (!frozenRef.current) return;
    buildGrid();
  }, [buildGrid]);

  // Viewport click/touch to freeze; keyboard shortcuts; rebuild on resize.
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const onVpPointer = () => { if (!frozenRef.current) freeze(); };
    vp.addEventListener('click', onVpPointer);
    vp.addEventListener('touchstart', onVpPointer, { passive: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); if (frozenRef.current) resume(); else freeze(); }
      if (e.code === 'Escape') resume();
    };
    document.addEventListener('keydown', onKeyDown);

    const onResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(buildGrid, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      vp.removeEventListener('click', onVpPointer);
      vp.removeEventListener('touchstart', onVpPointer);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [freeze, resume, buildGrid]);

  // Derived animation values.
  const anim = useMemo(() => {
    if (!layout || layout.sequence.length === 0) return null;
    const totalRows = 2 + Math.ceil((layout.sequence.length - 1) / layout.cols);
    const dist = totalRows * (layout.row + GAP);
    return { dist: `-${dist}px`, dur: `${totalRows * 5}s` };
  }, [layout]);

  // Tall flags are left exactly as planned: the sequence builder simulates
  // grid placement using these spans, so demoting one here would shift every
  // following tile off the rows its spacing was calculated against.
  const cells = useMemo(() => (layout ? layout.sequence.slice(1) : []), [layout]);

  if (!layout || layout.sequence.length === 0) {
    return (
      <div ref={vpRef} className={styles.viewport}>
        <div ref={trackRef} className={styles.track} />
      </div>
    );
  }

  const logoItem = layout.sequence[0];

  return (
    <>
      <div
        ref={vpRef}
        className={`${styles.viewport}${frozen ? ` ${styles.frozen}` : ''}`}
        style={frozen ? { overflowY: 'auto' } : undefined}
      >
        <div
          ref={trackRef}
          className={`${styles.track}${!frozen ? ` ${styles.trackScrolling}` : ''}`}
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, ${layout.col}px)`,
            gap: GAP,
            padding: GAP,
            ...(anim ? ({ '--cg-dist': anim.dist, '--cg-dur': anim.dur } as React.CSSProperties) : {}),
            ...(frozen ? { transform: 'none', position: 'relative', width: '100%' } : {}),
          }}
        >
          {/* Logo cell (2-col × 2-row): masked artwork + city overlay */}
          <a
            className={styles.logoCell}
            href={logoItem.url}
            style={{ height: layout.row * 2 + GAP, '--cg-row-px': `${layout.row}px` } as React.CSSProperties}
          >
            <div
              className={styles.logoCellArt}
              style={{ WebkitMaskImage: `url(${maskImageUrl})`, maskImage: `url(${maskImageUrl})` }}
            >
              <div className={styles.logoCellArtBg} style={{ backgroundImage: `url(${logoItem.src})` }} />
            </div>
            <div className={styles.logoCityOverlay} style={{ backgroundImage: `url(${overlayImageUrl})` }} />
            <div className={styles.logoArtistName}>Artwork above by {logoItem.name}</div>
          </a>

          {/* Artwork cells — plain tiles while ambient, links when frozen */}
          {cells.map((item, i) => {
            // Through next/image rather than a bare <img>: this grid renders
            // ~100 tiles per page view, and serving each one as a full-size
            // original was pulling the whole Blob store's worth of bytes on
            // every visit. next/image fetches each source once, caches the
            // optimised copy on the CDN, and hands the browser something
            // sized for the cell instead of for print.
            const cellContent = (
              <Image
                src={item.src}
                alt=""
                fill
                // A tall cell is one column wide but two rows high, and
                // object-cover scales a landscape source to fill that height —
                // so it needs roughly twice the pixels across that a square
                // cell does. Reporting the plain column width here left tall
                // tiles visibly soft.
                sizes={`${Math.round(layout.col * (item.tall ? 2 : 1))}px`}
                quality={75}
                // Only the first couple of rows are on screen at load; the
                // rest stream in as the grid scrolls them into view.
                loading={i < layout.cols * 2 ? 'eager' : 'lazy'}
                style={focalStyle(item.focal, '50% 35%')}
              />
            );
            const className = `${styles.cell}${item.tall ? ` ${styles.cellTall}` : ''}${frozen ? ` ${styles.cellClickable}` : ''}`;
            const height = item.tall ? layout.row * 2 + GAP : layout.row;
            return frozen ? (
              <a key={i} href={item.url} className={className} style={{ height }} onClick={e => e.stopPropagation()}>
                {cellContent}
              </a>
            ) : (
              <div key={i} className={className} style={{ height }}>
                {cellContent}
              </div>
            );
          })}
        </div>
      </div>
      <button
        className={`${styles.resumeBtn}${frozen ? ` ${styles.resumeBtnVisible}` : ''}`}
        onClick={e => { e.stopPropagation(); resume(); }}
      >
        &#9654; resume
      </button>
    </>
  );
}
