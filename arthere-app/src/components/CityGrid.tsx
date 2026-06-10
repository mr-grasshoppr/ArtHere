'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './CityGrid.module.css';

export interface ArtistGridData {
  url: string;   // e.g. /artists/kurtis-piltz
  name: string;
  images: { src: string; isHero: boolean }[];
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
  tall: boolean;
  url: string;
  name: string;
}

function buildSequence(artists: ArtistGridData[], spread: number): SequenceItem[] {
  const repeats = artists.length < 10 ? 1 : 3;
  const seq: SequenceItem[] = [];
  const recent: string[] = [];

  for (let r = 0; r < repeats; r++) {
    for (const artist of shuffle(artists)) {
      const candidates = artist.images.filter(img => !recent.includes(img.src));
      const pool = candidates.length > 0 ? candidates : artist.images;
      const img = pool[Math.floor(Math.random() * pool.length)];
      seq.push({ src: img.src, tall: img.isHero, url: artist.url, name: artist.name });
      recent.push(img.src);
      if (recent.length > spread) recent.shift();
    }
  }
  return seq;
}

export function CityGrid({ artists, overlayImageUrl, maskImageUrl }: Props) {
  const vpRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frozenRef = useRef(false);
  const [resumeVisible, setResumeVisible] = useState(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calcDims = useCallback(() => {
    const cols = window.innerWidth < 500 ? 3 : 4;
    const vw = window.innerWidth;
    const col = Math.floor((vw - GAP * (cols + 1)) / cols);
    return { cols, col, row: col };
  }, []);

  const buildGrid = useCallback(() => {
    const vp = vpRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;

    // Reset state
    frozenRef.current = false;
    setResumeVisible(false);
    vp.style.overflowY = '';
    vp.scrollTop = 0;
    vp.classList.remove(styles.frozen);

    track.innerHTML = '';
    track.style.transform = '';
    track.style.position = '';
    track.style.width = '';
    track.classList.remove(styles.trackScrolling);

    const { cols, col, row } = calcDims();
    const spread = cols * 5;

    track.style.gridTemplateColumns = `repeat(${cols}, ${col}px)`;
    track.style.gap = `${GAP}px`;
    track.style.padding = `${GAP}px`;

    const seq = buildSequence(artists, spread);
    if (seq.length === 0) return;

    // ── Logo cell (first item, 2-col × 2-row) ──
    const logoItem = seq[0];
    const logoCell = document.createElement('a');
    logoCell.className = styles.logoCell;
    logoCell.href = logoItem.url;
    logoCell.style.height = `${row * 2 + GAP}px`;
    logoCell.style.setProperty('--cg-row-px', `${row}px`);

    const artDiv = document.createElement('div');
    artDiv.className = styles.logoCellArt;
    // mask-image depends on a prop so it must be set via inline style
    artDiv.style.setProperty('-webkit-mask-image', `url(${maskImageUrl})`);
    artDiv.style.setProperty('mask-image', `url(${maskImageUrl})`);

    const artBg = document.createElement('div');
    artBg.className = styles.logoCellArtBg;
    artBg.style.backgroundImage = `url(${logoItem.src})`;
    artDiv.appendChild(artBg);
    logoCell.appendChild(artDiv);

    const overlayDiv = document.createElement('div');
    overlayDiv.className = styles.logoCityOverlay;
    overlayDiv.style.backgroundImage = `url(${overlayImageUrl})`;
    logoCell.appendChild(overlayDiv);

    const nameEl = document.createElement('div');
    nameEl.className = styles.logoArtistName;
    nameEl.textContent = `Artwork above by ${logoItem.name}`;
    logoCell.appendChild(nameEl);

    track.appendChild(logoCell);

    // ── Artwork cells ──
    let lastWasTall = false;
    for (let i = 1; i < seq.length; i++) {
      const art = seq[i];
      const useTall: boolean = art.tall && !lastWasTall;
      lastWasTall = useTall;

      const cell = document.createElement('div');
      cell.className = styles.cell + (useTall ? ` ${styles.cellTall}` : '');
      cell.style.height = `${useTall ? row * 2 + GAP : row}px`;
      cell.dataset.url = art.url;

      const img = document.createElement('img');
      img.src = art.src;
      img.alt = '';
      img.loading = 'lazy';
      cell.appendChild(img);
      track.appendChild(cell);
    }

    // ── Animation CSS variables ──
    const totalRows = 2 + Math.ceil((seq.length - 1) / cols);
    const dist = totalRows * (row + GAP);
    track.style.setProperty('--cg-dist', `-${dist}px`);
    track.style.setProperty('--cg-dur', `${totalRows * 5}s`);

    // Force reflow so animation starts from the top, then enable
    void track.offsetHeight;
    track.classList.add(styles.trackScrolling);
  }, [artists, calcDims, maskImageUrl, overlayImageUrl]);

  const freeze = useCallback(() => {
    if (frozenRef.current) return;
    frozenRef.current = true;
    setResumeVisible(true);

    const track = trackRef.current;
    const vp = vpRef.current;
    if (!track || !vp) return;

    // Capture the current mid-animation Y offset from the CSS transform matrix
    const matrix = window.getComputedStyle(track).transform;
    let currentY = 0;
    if (matrix && matrix !== 'none') {
      const match = matrix.match(/matrix.*\((.+)\)/);
      if (match) currentY = parseFloat(match[1].split(', ')[5]) || 0;
    }

    // Stop animation and switch to native scroll at the captured position
    track.classList.remove(styles.trackScrolling);
    track.style.transform = 'none';
    track.style.position = 'relative';
    track.style.width = '100%';
    vp.style.overflowY = 'auto';
    vp.scrollTop = Math.max(0, -currentY);
    vp.classList.add(styles.frozen);

    // Make each artwork cell navigable
    track.querySelectorAll<HTMLElement>('[data-url]').forEach(cell => {
      cell.classList.add(styles.cellClickable);
      cell.addEventListener('click', e => {
        e.stopPropagation();
        const url = cell.dataset.url;
        if (url) window.location.href = url;
      }, { once: true });
    });
  }, []);

  const resume = useCallback(() => {
    if (!frozenRef.current) return;
    buildGrid();
  }, [buildGrid]);

  // Mount: build the grid
  useEffect(() => {
    buildGrid();
  }, [buildGrid]);

  // Viewport click/touch to freeze; keyboard shortcuts
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const onVpClick = () => { if (!frozenRef.current) freeze(); };
    const onVpTouch = () => { if (!frozenRef.current) freeze(); };
    vp.addEventListener('click', onVpClick);
    vp.addEventListener('touchstart', onVpTouch, { passive: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); frozenRef.current ? resume() : freeze(); }
      if (e.code === 'Escape') resume();
    };
    document.addEventListener('keydown', onKeyDown);

    const onResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(buildGrid, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      vp.removeEventListener('click', onVpClick);
      vp.removeEventListener('touchstart', onVpTouch);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [freeze, resume, buildGrid]);

  return (
    <>
      <div ref={vpRef} className={styles.viewport}>
        <div ref={trackRef} className={styles.track} />
      </div>
      <button
        className={`${styles.resumeBtn}${resumeVisible ? ` ${styles.resumeBtnVisible}` : ''}`}
        onClick={e => { e.stopPropagation(); resume(); }}
      >
        &#9654; resume
      </button>
    </>
  );
}
