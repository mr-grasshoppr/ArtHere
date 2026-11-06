/**
 * PREVIEW — real events scraped from https://artdesignxchange.com/events, shown
 * only on the unlinked /preview/adx/* pages so the new events and map designs
 * can be shared before there is enough data to launch them.
 *
 * Nothing here touches the database, and the ADX place itself stays unpublished.
 * Descriptions are summarized, not copied. Cover images are the event artwork
 * from ADX's calendar, saved in public/images/adx-preview/ (ADX hasn't signed off
 * on them yet, so get their OK before this goes beyond a private preview link).
 */
import type { BoardEvent } from '@/components/HappeningsBoard';
import { dayDate, type Happening, type EventKind } from '@/lib/mock-happenings';

/** Matches the place's name in the database, so the map pin lights up. */
export const ADX_PLACE_NAME = 'ADX (Art Design Xchange)';
const ADX_SITE = 'https://artdesignxchange.com';

interface PreviewEvent {
  id: string;
  name: string;
  /** Site-timezone calendar day, "YYYY-MM-DD". */
  day: string;
  time: string;
  kind: EventKind;
  price: string | null;
  free: boolean;
  summary: string;
  path: string;
}

export const ADX_PREVIEW_EVENTS: PreviewEvent[] = [
  {
    id: 'adx-fest-grand-opening',
    name: 'ADX Fest Grand Opening Party',
    day: '2026-10-02',
    time: '6–9 PM',
    kind: 'opening',
    price: 'Free',
    free: true,
    summary: 'Opening night of ADX Fest, celebrating 15 years of ADX with an alumni and member exhibition, a time capsule, workshops and live screenprinting.',
    path: '/events/adx-fest-adx-15-years-in-the-making',
  },
  {
    id: 'william-park-retrospective',
    name: 'William Park Retrospective (opening night)',
    day: '2026-11-06',
    time: '5–9 PM',
    kind: 'opening',
    price: null,
    free: false,
    summary: 'A retrospective honoring painter William Park, with paintings, photographs, writings and sketchbooks. On view through November.',
    path: '/events/william-park-retrospective',
  },
  {
    id: 'arthack',
    name: 'ARTHACK',
    day: '2026-11-10',
    time: '6–10 PM',
    kind: 'talk',
    price: 'Free',
    free: true,
    summary: 'A monthly evening of discussion for computer enthusiasts and artists working where code, art and hardware meet.',
    path: '/events/arthack-mtd89-53dw5',
  },
  {
    id: 'puppetry-in-progress',
    name: 'Puppetry in Progress',
    day: '2026-11-15',
    time: '6:30–9:30 PM',
    kind: 'performance',
    price: 'Free',
    free: true,
    summary: 'Watch, make and learn about puppetry in any style, from finished pieces to works in progress.',
    path: '/events/puppetry-in-progress',
  },
  {
    id: 'women-in-film-holiday-party',
    name: 'Women in Film Holiday Party',
    day: '2026-11-20',
    time: '6–9 PM',
    kind: 'opening',
    price: 'Free for members · $25',
    free: false,
    summary: 'WIF-PDX’s annual holiday party and fundraiser, with a silent auction and the 2026 Vision Grant announcement.',
    path: '/events/women-in-film-holiday-party',
  },
];

/** For the events board. `past` is judged against today's date in the viewer's server clock. */
export function adxBoardEvents(): BoardEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return ADX_PREVIEW_EVENTS.map((e) => ({
    id: e.id,
    name: e.name,
    startDay: e.day,
    endDay: e.day,
    time: e.time,
    through: '',
    placeName: ADX_PLACE_NAME,
    href: `${ADX_SITE}${e.path}`,
    external: true,
    price: e.price,
    audience: null,
    past: e.day < today,
    coverUrl: `/images/adx-preview/${e.id}.webp`,
  }));
}

/** For the map's timeline: day offsets from today, so call from the client. */
export function adxHappenings(): Happening[] {
  const base = dayDate(0).getTime();
  const offset = (day: string) => {
    const [y, m, d] = day.split('-').map(Number);
    return Math.round((new Date(y, m - 1, d).getTime() - base) / 86400000);
  };
  return ADX_PREVIEW_EVENTS.map((e) => ({
    id: e.id,
    place: ADX_PLACE_NAME,
    title: e.name,
    kind: e.kind,
    start: offset(e.day),
    end: offset(e.day),
    time: e.time,
    image: `/images/adx-preview/${e.id}.webp`,
    family: false,
    adult: false,
    free: e.free,
    artists: [],
  }));
}
