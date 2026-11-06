/**
 * PROTOTYPE — mock "happenings" for trying the map timeline.
 *
 * Nothing here touches the database. Events are generated from the places
 * (and, on the Network view, the artists linked to them) that the map already
 * has, seeded by name so the same place gets the same events on both views and
 * on every reload. Days are offsets from today, so the data never goes stale.
 *
 * Switched on with ?mock=1 on the map tab, and never in production builds.
 */

/** Brand pink: whatever has something on in the window, on the map, network and timeline alike. */
export const HAPPENING_COLOR = '#f96a9b';

/** Days from today the timeline covers. */
export const HAP_MIN = -45;
export const HAP_MAX = 59;
export const HAP_DAYS = HAP_MAX - HAP_MIN + 1;

export const KINDS = ['opening', 'talk', 'workshop', 'open studio', 'art walk', 'monthly', 'performance'] as const;
export type EventKind = (typeof KINDS)[number];

export type WhoFilter = 'family' | 'adult' | null;
export type WhatFilter = 'all' | 'free' | EventKind;

export interface Happening {
  id: string;
  /** The place's name — the key shared by pins and network nodes. */
  place: string;
  /** Every place taking part, for an event several places host together. Includes `place`. */
  hosts?: string[];
  title: string;
  kind: EventKind;
  /** Inclusive day offsets from today. */
  start: number;
  end: number;
  /** "6–8 PM". */
  time?: string;
  /** A room or area within the place. */
  where?: string;
  image?: string;
  family: boolean;
  /** 18 and over only. Never set together with `family`. */
  adult: boolean;
  free: boolean;
  /** Names of connected artists credited on the event (Network view only). */
  artists: string[];
}

export interface HappeningsWindow {
  a: number;
  b: number;
}

export interface HappeningsState {
  /** The Happenings bar is pulled open: the timeline and filters show and the map responds. */
  open: boolean;
  /** The days picked on the timeline; null until someone picks some. */
  brush: HappeningsWindow | null;
  who: WhoFilter;
  what: WhatFilter;
}

export const DEFAULT_HAPPENINGS_STATE: HappeningsState = { open: true, brush: null, who: null, what: 'all' };

/** With no days picked, places with something on in the next week are ringed. */
export const AMBIENT_WINDOW: HappeningsWindow = { a: 0, b: 6 };

/** Mock data is for local development only. */
export function mockHappeningsEnabled(param: string | string[] | undefined): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return (Array.isArray(param) ? param[0] : param) === '1';
}

export interface MockPlace {
  name: string;
  neighborhood?: string | null;
  artists?: string[];
}

const TITLES: Record<EventKind, string[]> = {
  opening: ['Opening: Soft Hours', 'Opening: Salt Maps', 'Opening: Paper Weather', 'Opening: Borrowed Rooms', 'Opening: Glass Gardens'],
  talk: ['Artist talk', 'Panel: Making a living', 'Conversation with the curator', 'Critique night'],
  workshop: ['Workshop: Risograph basics', 'Workshop: Natural dyes', 'Workshop: Life drawing', 'Workshop: Zine making', 'Workshop: Clay hand-building'],
  'open studio': ['Open studio'],
  'art walk': ['Neighborhood art walk'],
  monthly: ['First Friday Art Walk'],
  performance: ['Live set', 'Dance performance', 'Poetry reading', 'Sound performance'],
};

const TIMES: Record<EventKind, string[]> = {
  opening: ['6–8 PM'],
  talk: ['7 PM', '6:30 PM'],
  workshop: ['10 AM–12 PM', '6–8 PM'],
  'open studio': ['12–5 PM'],
  'art walk': ['5–8 PM'],
  monthly: ['6–9 PM'],
  performance: ['8 PM', '7:30 PM'],
};

// How often an event of each kind is for families, adults only, or free.
const FAMILY: Record<EventKind, number> = { opening: 0.1, talk: 0.05, workshop: 0.6, 'open studio': 0.3, 'art walk': 0.3, monthly: 0.6, performance: 0.5 };
const ADULT: Record<EventKind, number> = { opening: 0.35, talk: 0.3, workshop: 0.1, 'open studio': 0.05, 'art walk': 0.1, monthly: 0.1, performance: 0.3 };
const FREE: Record<EventKind, number> = { opening: 0.7, talk: 0.6, workshop: 0.3, 'open studio': 0.8, 'art walk': 0.9, monthly: 0.9, performance: 0.4 };
// What a place's own events are, weighted.
const KIND_WEIGHTS: [EventKind, number][] = [['opening', 3], ['talk', 2], ['workshop', 3], ['open studio', 3], ['performance', 2], ['art walk', 1]];

// Busiest on weekends, quiet early in the week (Sunday first).
const DAY_WEIGHT = [1.8, 0.45, 0.5, 0.7, 1.2, 2.4, 3.0];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The calendar date of a day offset from today. */
export function dayDate(offset: number): Date {
  const d = today();
  d.setDate(d.getDate() + offset);
  return d;
}

function pick<T>(list: T[], r: () => number): T {
  return list[Math.floor(r() * list.length)];
}

function shuffled<T>(list: T[], r: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Offset of the next Nov 6 that falls inside the timeline, or null. */
function nextNovSixth(): number | null {
  const t = today();
  for (const year of [t.getFullYear(), t.getFullYear() + 1]) {
    const off = Math.round((new Date(year, 10, 6).getTime() - t.getTime()) / 86400000);
    if (off >= HAP_MIN && off <= HAP_MAX) return off;
  }
  return null;
}

/** One to three events per place; artists, when given, are the ones linked to that place. */
export function buildMockHappenings(places: MockPlace[]): Happening[] {
  const out: Happening[] = [];

  // Day offsets weighted by weekday, tapering gently into the future.
  const cum: number[] = [];
  let total = 0;
  for (let d = HAP_MIN; d <= HAP_MAX; d++) {
    const dow = dayDate(d).getDay();
    total += DAY_WEIGHT[dow] * (d > 0 ? 1 - (0.35 * d) / 60 : 1);
    cum.push(total);
  }
  const sampleDay = (r: () => number) => {
    const x = r() * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return HAP_MIN + lo;
  };
  const credit = (p: MockPlace, r: () => number, max: number) => {
    const pool = shuffled(p.artists ?? [], r);
    return !pool.length || r() < 0.2 ? [] : pool.slice(0, max);
  };
  const flags = (id: string, kind: EventKind) => {
    const r = rng(hash(`${id}#flags`));
    const family = r() < FAMILY[kind];
    const adult = !family && r() < ADULT[kind];
    return { family, adult, free: r() < FREE[kind] };
  };
  const weighted = (r: () => number) => {
    const sum = KIND_WEIGHTS.reduce((n, [, w]) => n + w, 0);
    let x = r() * sum;
    for (const [k, w] of KIND_WEIGHTS) {
      x -= w;
      if (x < 0) return k;
    }
    return 'opening' as EventKind;
  };

  for (const p of places) {
    const r = rng(hash(p.name));
    const count = 1 + Math.floor(r() * 3);
    for (let i = 0; i < count; i++) {
      const kind = weighted(r);
      const start = sampleDay(r);
      const len = kind === 'open studio' && r() < 0.3 ? 2 : 1;
      const id = `${p.name}#${i}`;
      out.push({
        id,
        place: p.name,
        title: kind === 'open studio' ? `Open studio at ${p.name}` : pick(TITLES[kind], r),
        kind,
        start,
        end: Math.min(HAP_MAX, start + len - 1),
        time: pick(TIMES[kind], r),
        ...flags(id, kind),
        artists: credit(p, r, 3),
      });
    }
  }

  // First Fridays and First Thursdays: several places on the same evening.
  const r2 = rng(777);
  for (let d = HAP_MIN; d <= HAP_MAX; d++) {
    const date = dayDate(d);
    const dow = date.getDay();
    const dom = date.getDate();
    const make = (title: string, take: number) => {
      shuffled(places, r2)
        .slice(0, Math.min(take, places.length))
        .forEach((p) => {
          const id = `${title}#${d}#${p.name}`;
          out.push({ id, place: p.name, title, kind: 'monthly', start: d, end: d, time: pick(TIMES.monthly, r2), ...flags(id, 'monthly'), artists: credit(p, r2, 1) });
        });
    };
    if (dow === 5 && dom <= 7) make('First Friday Art Walk', 5);
    if (dow === 4 && dom <= 7) make('First Thursday Gallery Night', 3);
  }

  // Multnomah Village's First Friday: several places host the one evening.
  const nov6 = nextNovSixth();
  const mac = places.find((p) => /multnomah arts center/i.test(p.name));
  const village = places.filter((p) => /multnomah/i.test(p.neighborhood ?? '') || /multnomah arts center/i.test(p.name));
  if (nov6 !== null && village.length > 1) {
    const hosts = village.map((p) => p.name);
    out.push({
      id: 'special#village-first-friday',
      place: hosts[0],
      hosts,
      title: 'Multnomah Village First Friday',
      kind: 'monthly',
      start: nov6,
      end: nov6,
      time: 'Evening',
      family: true,
      adult: false,
      free: true,
      artists: village.flatMap((p) => p.artists ?? []).slice(0, 4),
    });
  }
  if (nov6 !== null && mac) {
    out.push({
      id: 'special#mac-first-friday',
      place: mac.name,
      title: 'First Friday Arts for All: Woodland Dioramas!',
      kind: 'monthly',
      start: nov6,
      end: nov6,
      time: '6–8 PM',
      where: 'MAC Auditorium',
      image: '/images/mock-mac-first-friday.jpg',
      family: true,
      adult: false,
      free: true,
      artists: (mac.artists ?? []).slice(0, 3),
    });
  }

  // One citywide weekend, hosted by several places at once.
  const weekend = (() => {
    for (let d = 7; d <= HAP_MAX; d++) if (dayDate(d).getDay() === 6) return d;
    return null;
  })();
  if (weekend !== null && places.length > 6) {
    const hosts = shuffled(places, rng(4242)).slice(0, 8).map((p) => p.name);
    out.push({
      id: 'special#citywide-open-studios',
      place: hosts[0],
      hosts,
      title: 'Citywide Open Studios',
      kind: 'open studio',
      start: weekend,
      end: weekend + 1,
      time: '12–5 PM',
      family: false,
      adult: false,
      free: true,
      artists: [],
    });
  }
  return out;
}

/** Does this event match the Who and What filters? */
export function passes(e: Happening, s: Pick<HappeningsState, 'who' | 'what'>): boolean {
  if (s.who === 'family' && !e.family) return false;
  if (s.who === 'adult' && !e.adult) return false;
  if (s.what === 'free') return e.free;
  if (s.what !== 'all') return e.kind === s.what;
  return true;
}

export function inWindow(e: Happening, w: HappeningsWindow): boolean {
  return e.start <= w.b && e.end >= w.a;
}

/** The days the map is showing: the picked days, else the day being hovered on the timeline. */
export function windowOf(state: HappeningsState, preview: number | null): HappeningsWindow | null {
  if (state.brush) return state.brush;
  if (preview !== null) return { a: preview, b: preview };
  return null;
}

/** Every place that has this event: the host list when there is one. */
export function eventPlaces(e: Happening): string[] {
  return e.hosts ?? [e.place];
}

/** Are these two sets of place names the same? Keeps "what's in view" from re-rendering on every pan frame. */
export function sameNames(a: Set<string> | null, b: Set<string>): boolean {
  if (!a || a.size !== b.size) return false;
  for (const n of b) if (!a.has(n)) return false;
  return true;
}

/** Events per day over the whole timeline, for the chart. */
export function dayCounts(events: Happening[]): number[] {
  const counts = new Array<number>(HAP_DAYS).fill(0);
  for (const e of events) {
    for (let d = Math.max(e.start, HAP_MIN); d <= Math.min(e.end, HAP_MAX); d++) counts[d - HAP_MIN]++;
  }
  return counts;
}

/**
 * The events a place's card should show: the ones in the picked days first,
 * then whatever is still to come.
 */
export function cardEvents(events: Happening[], place: string, w: HappeningsWindow | null): Happening[] {
  const mine = events
    .filter((e) => e.end >= 0 && eventPlaces(e).includes(place))
    .sort((x, y) => x.start - y.start || (y.image ? 1 : 0) - (x.image ? 1 : 0) || (x.hosts ? 1 : 0) - (y.hosts ? 1 : 0));
  if (!w) return mine;
  const inside = mine.filter((e) => inWindow(e, w));
  return [...inside, ...mine.filter((e) => !inside.includes(e))];
}

/** "Mon, Nov 2" style label for a day offset from today. */
export function formatDay(offset: number, long = false): string {
  return dayDate(offset).toLocaleDateString('en-US', long ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
}

export function formatRange(w: HappeningsWindow): string {
  return w.a === w.b ? formatDay(w.a, true) : `${formatDay(w.a)} – ${formatDay(w.b)}`;
}

/** "Fri, Nov 6 · 6–8 PM" for a card. */
export function formatWhen(e: Happening): string {
  const day = e.start === e.end ? formatDay(e.start, true) : `${formatDay(e.start)} – ${formatDay(e.end)}`;
  return e.time ? `${day} · ${e.time}` : day;
}

/** A one-line summary for a hover card: the first event, then how many more. */
export function describeHappenings(events: Happening[]): string {
  if (events.length === 0) return '';
  const first = events[0];
  const when = first.end > first.start ? `${formatDay(first.start)}–${formatDay(first.end)}` : formatDay(first.start);
  const rest = events.length > 1 ? ` · +${events.length - 1} more` : '';
  return `${first.title}, ${when}${rest}`;
}
