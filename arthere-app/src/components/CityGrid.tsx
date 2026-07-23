'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import styles from './CityGrid.module.css';

interface CropBox { x: number; y: number; w: number; h: number; }

export interface ArtistGridData {
  url: string;   // e.g. /artists/kurtis-piltz
  name: string;
  images: { src: string; cropBox?: CropBox | null; isHero: boolean }[];
}

interface Props {
  artists: ArtistGridData[];
  overlayImageUrl: string;
  maskImageUrl: string;
}

const GAP = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SequenceItem {
  src: string;
  cropBox?: CropBox | null;
  tall: boolean;
  url: string;
  name: string;
}

function buildSequence(artists: ArtistGridData[], spread: number): SequenceItem[] {
  // Repeat enough times to include every image from every artist at least once,
  // and always at least 3 passes so the scrolling grid has enough content.
  const maxPerArtist = Math.max(...artists.map(a => a.images.length), 1);
  const repeats = Math.max(3, maxPerArtist);
  const seq: SequenceItem[] = [];
  const recent: string[] = [];

  for (let r = 0; r < repeats; r++) {
    for (const artist of shuffle(artists)) {
      const candidates = artist.images.filter(img => !recent.includes(img.src));
      const pool = candidates.length > 0 ? candidates : artist.images;
      const img = pool[Math.floor(Math.random() * pool.length)];
      seq.push({ src: img.src, cropBox: img.cropBox, tall: img.isHero, url: artist.url, name: artist.name });
      recent.push(img.src);
      if (recent.length > spread) recent.shift();
    }
  }
  return seq;
}

/**
 * Positions an <img> inside its cell so that only the artwork region
 * (cropBox, in fractional coordinates) is visible.
 */
function CroppedCellImage({ src, cropBox }: { src: string; cropBox: CropBox }) {
  const ref = useRef<HTMLImageElement>(null);

  const onLoad = () => {
    const img = ref.current;
    const cell = img?.parentElement;
    if (!img || !cell) return;
    const { naturalWidth: iw, naturalHeight: ih } = img;
    const { offsetWidth: cw, offsetHeight: ch } = cell;
    const { x, y, w, h } = cropBox;
    const scale = Math.max(cw / (w * iw), ch / (h * ih));
    Object.assign(img.style, {
      position: 'absolute',
      width: `${iw * scale}px`,
      height: `${ih * scale}px`,
      left: `${-x * iw * scale}px`,
      top: `${-y * ih * scale}px`,
      maxWidth: 'none',
      display: 'block',
      transition: 'transform 0.3s',
    });
  };

  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt="" onLoad={onLoad} loading="eager" />;
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
    const spread = cols * 5;
    setLayout({ cols, col, row: col, sequence: buildSequence(artists, spread) });

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

  // Tall flags with the "no two consecutive tall cells" rule applied.
  const cells = useMemo(() => {
    if (!layout) return [];
    let lastWasTall = false;
    return layout.sequence.slice(1).map(item => {
      const useTall = item.tall && !lastWasTall;
      lastWasTall = useTall;
      return { ...item, tall: useTall };
    });
  }, [layout]);

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
            const cellContent = item.cropBox ? (
              <CroppedCellImage src={item.src} cropBox={item.cropBox} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.src} alt="" loading="eager" />
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
