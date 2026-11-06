'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_HAPPENINGS_STATE,
  HAP_DAYS,
  HAP_MAX,
  HAP_MIN,
  HAPPENING_COLOR,
  KINDS,
  dayCounts,
  formatDay,
  formatRange,
  windowOf,
  type Happening,
  type HappeningsState,
  type HappeningsWindow,
  type WhatFilter,
  type WhoFilter,
} from '@/lib/mock-happenings';

const KEY = 'arthere:happenings:v2';

/**
 * The happenings state, kept in sessionStorage so switching between the
 * Geographic and Network views keeps the same days and filters. Starts at the
 * defaults on the server and first paint, then restores. The day being hovered
 * on the timeline is separate and never saved.
 */
export function useHappeningsState() {
  const [state, setState] = useState<HappeningsState>(DEFAULT_HAPPENINGS_STATE);
  const [preview, setPreview] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      // Restored after hydration (not in the initial state) so server and client agree.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ ...DEFAULT_HAPPENINGS_STATE, ...JSON.parse(raw) });
    } catch {
      // Private mode or blocked storage: start at the defaults.
    }
    setReady(true);
  }, []);
  const update = useCallback((patch: Partial<HappeningsState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Not persisted; still works for this view.
      }
      return next;
    });
  }, []);
  return { state, update, preview, setPreview, ready };
}

const PRESETS: { id: string; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

function presetRange(id: string): HappeningsWindow {
  if (id === 'today') return { a: 0, b: 0 };
  if (id === 'weekend') {
    const dow = new Date().getDay();
    if (dow === 0) return { a: 0, b: 0 };
    if (dow === 6) return { a: 0, b: 1 };
    const a = 6 - dow;
    return { a, b: a + 1 };
  }
  if (id === 'week') return { a: 0, b: 6 };
  return { a: 0, b: 29 };
}

const sameWindow = (x: HappeningsWindow | null, y: HappeningsWindow) => !!x && x.a === y.a && x.b === y.b;

/** A row of single-choice pills; the selected one is outlined in chartreuse. */
function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex-none rounded-full border px-2.5 py-[3px] text-[0.75rem] capitalize ${
        on ? 'border-[#bdd349] bg-[#232612] text-white' : 'border-[#333] bg-[#111] text-[#cfcfcf] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <span className="flex-none self-center text-[0.625rem] uppercase tracking-[0.08em] text-[#777]">{children}</span>;
}

/**
 * The Happenings bar at the bottom of the map tab: a chartreuse bar that pulls
 * open into a timeline (days picked by hovering, clicking or dragging) and the
 * When / Who / What filters. Pulled shut, happenings are off. The view itself
 * decides what to light; this component only owns the days and the filters.
 */
export function HappeningsDock({
  events,
  inView,
  state,
  update,
  preview,
  setPreview,
  onHeight,
}: {
  /** Events that pass the Who and What filters, citywide: the grey bars behind the pink ones. */
  events: Happening[];
  /** The same events narrowed to what's in the current view: the pink bars. */
  inView: Happening[];
  state: HappeningsState;
  update: (patch: Partial<HappeningsState>) => void;
  preview: number | null;
  setPreview: (day: number | null) => void;
  /** Reports the dock's height so the view can lift its own controls above it. */
  onHeight?: (px: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const dragFrom = useRef<number | null>(null);
  const moved = useRef(false);
  // True when the click began on a day that was already the one chosen day.
  const wasThatDay = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !onHeight) return;
    const report = () => onHeight(el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, state.open]);

  const w = windowOf(state, preview);
  const cityCounts = dayCounts(events);
  const viewCounts = dayCounts(inView);
  const max = Math.max(1, ...cityCounts);

  const dayAt = (clientX: number) => {
    const box = chartRef.current?.getBoundingClientRect();
    if (!box) return 0;
    const i = Math.floor(((clientX - box.left) / box.width) * HAP_DAYS);
    return HAP_MIN + Math.max(0, Math.min(HAP_DAYS - 1, i));
  };

  const shift = (by: number) => {
    const cur = state.brush ?? (preview !== null ? { a: preview, b: preview } : { a: 0, b: 0 });
    const len = cur.b - cur.a;
    const a = Math.max(HAP_MIN, Math.min(HAP_MAX - len, cur.a + by));
    update({ brush: { a, b: a + len } });
  };

  return (
    <div ref={rootRef} className="absolute bottom-0 left-0 right-0 z-30 text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: state.open ? '#1c1c1c' : '#c6d468' }}>
      <button
        type="button"
        onClick={() => {
          setPreview(null);
          update({ open: !state.open });
        }}
        aria-expanded={state.open}
        className="relative flex w-full items-center justify-between bg-[#c6d468] px-3 py-2 text-left text-[0.8rem] font-bold text-black hover:bg-[#d3df88] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-black"
      >
        <span>Happenings</span>
        <span className="text-[0.75rem] font-semibold">{state.open && w ? formatRange(w) : ''}</span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -ml-1.5 -mt-1 h-0 w-0 border-x-[6px] border-b-[8px] border-x-transparent border-b-black transition-transform"
          style={{ transform: state.open ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {state.open && (
        <div className="flex flex-col gap-2 border-t border-[#333] px-3 pb-3 pt-2.5">
          <div className="flex items-center gap-x-2 gap-y-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <GroupLabel>When</GroupLabel>
            <div className="inline-flex flex-none overflow-hidden rounded-[5px] border border-[#333]">
              {PRESETS.map((p, i) => {
                const r = presetRange(p.id);
                const on = sameWindow(state.brush, r);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ brush: on ? null : r })}
                    className={`px-2.5 py-1 text-[0.75rem] ${i ? 'border-l border-[#333]' : ''} ${
                      on ? 'bg-[#2a2a2a] text-white shadow-[inset_0_-2px_0_#f96a9b]' : 'bg-[#111] text-[#cfcfcf] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <span className="w-px flex-none self-stretch bg-[#333]" />
            <GroupLabel>Who</GroupLabel>
            {(
              [
                ['family', 'Family'],
                ['adult', '18+'],
              ] as [Exclude<WhoFilter, null>, string][]
            ).map(([id, label]) => (
              <Pill key={id} on={state.who === id} onClick={() => update({ who: state.who === id ? null : id })}>
                {label}
              </Pill>
            ))}
            <span className="w-px flex-none self-stretch bg-[#333]" />
            <GroupLabel>What</GroupLabel>
            {(['all', 'free', ...KINDS] as WhatFilter[]).map((id) => (
              <Pill key={id} on={state.what === id} onClick={() => update({ what: state.what === id && id !== 'all' ? 'all' : id })}>
                {id}
              </Pill>
            ))}
          </div>

          <div>
            <div
              ref={chartRef}
              role="slider"
              tabIndex={0}
              aria-label="Happenings per day. Drag to choose days. Arrow keys move the chosen days; Escape clears them."
              aria-valuemin={HAP_MIN}
              aria-valuemax={HAP_MAX}
              aria-valuenow={w?.a ?? 0}
              aria-valuetext={w ? formatRange(w) : 'No days chosen'}
              className={`relative flex h-[58px] cursor-ew-resize touch-none select-none items-end gap-px rounded-md bg-[#161616] px-px pt-2 outline-none focus-visible:ring-2 focus-visible:ring-[#bdd349]`}
              onPointerDown={(e) => {
                // Clicking or dragging never leaves a focus outline; only Tab does.
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                const d = dayAt(e.clientX);
                dragFrom.current = d;
                moved.current = false;
                wasThatDay.current = !!state.brush && state.brush.a === d && state.brush.b === d;
                update({ brush: { a: d, b: d } });
              }}
              onPointerMove={(e) => {
                const d = dayAt(e.clientX);
                if (dragFrom.current !== null) {
                  if (d !== dragFrom.current) moved.current = true;
                  update({ brush: { a: Math.min(dragFrom.current, d), b: Math.max(dragFrom.current, d) } });
                } else if (e.pointerType === 'mouse' && !state.brush) {
                  setPreview(d);
                }
              }}
              onPointerUp={() => {
                // A click on the one chosen day puts it away again.
                if (!moved.current && wasThatDay.current) update({ brush: null });
                dragFrom.current = null;
              }}
              onPointerLeave={() => setPreview(null)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') shift(-1);
                else if (e.key === 'ArrowRight') shift(1);
                else if (e.key === 'Escape') update({ brush: null });
                else return;
                e.preventDefault();
              }}
            >
              {cityCounts.map((city, i) => {
                const day = HAP_MIN + i;
                const inside = !w || (day >= w.a && day <= w.b);
                const barH = (n: number) => Math.round(3 + (n / max) * 40);
                const here = viewCounts[i];
                return (
                  <div
                    key={day}
                    className="pointer-events-none relative flex-1 rounded-t-[1px]"
                    style={{
                      height: city ? `${barH(city)}px` : '1px',
                      background: '#333',
                      outline: day === 0 ? '1px solid #fff' : undefined,
                      outlineOffset: 1,
                    }}
                  >
                    {here > 0 && (
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-t-[1px]"
                        style={{ height: `${barH(here)}px`, background: HAPPENING_COLOR, opacity: inside ? (day < 0 ? 0.7 : 1) : 0.3 }}
                      />
                    )}
                  </div>
                );
              })}
              {w && (
                <div
                  className="pointer-events-none absolute -bottom-[3px] -top-[3px] rounded border-[1.5px]"
                  style={{
                    borderColor: HAPPENING_COLOR,
                    background: 'rgba(249,106,155,0.14)',
                    left: `${((w.a - HAP_MIN) / HAP_DAYS) * 100}%`,
                    width: `${((w.b - w.a + 1) / HAP_DAYS) * 100}%`,
                  }}
                />
              )}
            </div>
            <div className="mt-1 flex justify-between text-[0.625rem] text-[#777]">
              <span>{formatDay(HAP_MIN)}</span>
              <span>today · pink is what&rsquo;s in view, grey is everywhere</span>
              <span>{formatDay(HAP_MAX)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
