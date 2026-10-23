// Helpers for org events. Dates are typed and shown in one site timezone and
// stored as UTC, so a 7pm opening reads as 7pm to everyone regardless of
// where the server (or the visitor's browser) happens to be.

// TODO: move onto City once there is more than one real city.
export const EVENT_TIMEZONE = 'America/Los_Angeles';

export const EVENT_NAME_MAX = 120;
export const EVENT_DESCRIPTION_MAX = 450;
export const EVENT_PRICE_MAX = 40;
export const EVENT_AUDIENCE_MAX = 60;

/** Suggestions for the audience field; anything else can be typed. */
export const AUDIENCE_SUGGESTIONS = ['All ages', 'Adults 18+', '21+', 'Teens', 'Kids & families', 'Members only'];

/** UTC offset (ms) of `timeZone` at the given instant. */
function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Wall-clock "2026-11-07" + "19:00" in `timeZone` -> the UTC Date. Null if malformed. */
export function zonedToUtc(date: string, time: string, timeZone = EVENT_TIMEZONE): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [y, mo, da, h, mi] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  const wall = Date.UTC(y, mo - 1, da, h, mi);
  const probe = new Date(wall);
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== da || h > 23 || mi > 59) return null;
  // Two passes settle the offset across a DST boundary.
  let utc = wall - zoneOffsetMs(wall, timeZone);
  utc = wall - zoneOffsetMs(utc, timeZone);
  return new Date(utc);
}

/** UTC Date -> { date: "YYYY-MM-DD", time: "HH:mm" } wall clock in `timeZone`, for form defaults. */
export function utcToZoned(value: Date, timeZone = EVENT_TIMEZONE): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(value);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` };
}

export interface EventFormInput {
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;   // blank = no end
  endTime: string;
  description: string;
  price: string;
  audience: string;
  /** "Learn more" page. */
  link: string;
}

export type ParsedEvent =
  | { ok: true; value: { name: string; startsAt: Date; endsAt: Date | null; allDay: boolean; description: string; linkUrl: string; price: string; audience: string } }
  | { ok: false; error: string };

/** Accepts "example.org/x" or a full URL; only http(s) is kept. Null when blank or unusable. */
export function normalizeEventLink(input: string | null | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.') ? url.toString() : null;
  } catch {
    return null;
  }
}

export function parseEventInput(input: EventFormInput): ParsedEvent {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Please give the event a name.' };
  if (name.length > EVENT_NAME_MAX) return { ok: false, error: `Event names are limited to ${EVENT_NAME_MAX} characters.` };
  const description = input.description.trim();
  if (!description) return { ok: false, error: 'Please add a short event description.' };
  if (description.length > EVENT_DESCRIPTION_MAX) return { ok: false, error: `Descriptions are limited to ${EVENT_DESCRIPTION_MAX} characters.` };

  const startsAt = zonedToUtc(input.startDate, input.startTime.trim());
  if (!startsAt) return { ok: false, error: 'Please enter a start date and start time.' };
  // An end date is only needed for events that run past midnight or over several days.
  const endsAt = zonedToUtc(input.endDate.trim() || input.startDate, input.endTime.trim());
  if (!endsAt) return { ok: false, error: 'Please enter an end time.' };
  if (endsAt <= startsAt) return { ok: false, error: 'The event can’t end before it starts.' };

  const price = input.price.trim();
  if (!price) return { ok: false, error: 'Please enter the price (or “Free”).' };
  if (price.length > EVENT_PRICE_MAX) return { ok: false, error: `Price is limited to ${EVENT_PRICE_MAX} characters.` };
  const audience = input.audience.trim();
  if (!audience) return { ok: false, error: 'Please enter the age range or who the event is for (e.g. “All ages”).' };
  if (audience.length > EVENT_AUDIENCE_MAX) return { ok: false, error: `Audience is limited to ${EVENT_AUDIENCE_MAX} characters.` };

  const linkUrl = normalizeEventLink(input.link);
  if (!linkUrl) return { ok: false, error: 'Please add a web address where people can learn more.' };
  return { ok: true, value: { name, startsAt, endsAt, allDay: false, description, linkUrl, price, audience } };
}

/** An event is "upcoming" until its end (or, with no end, the end of its start day). */
export function isUpcoming(event: { startsAt: Date; endsAt: Date | null }, now = new Date()): boolean {
  const end = event.endsAt ?? new Date(event.startsAt.getTime() + 24 * 60 * 60 * 1000);
  return end >= now;
}

const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: EVENT_TIMEZONE, weekday: 'short', month: 'short', day: 'numeric' });
const dayYearFmt = new Intl.DateTimeFormat('en-US', { timeZone: EVENT_TIMEZONE, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: EVENT_TIMEZONE, hour: 'numeric', minute: '2-digit' });

/** "Sat, Nov 7 · 7:00 PM – 9:00 PM", "Fri, Nov 6 – Sun, Nov 8", etc. */
export function formatEventWhen(e: { startsAt: Date; endsAt: Date | null; allDay: boolean }, now = new Date()): string {
  const sameYear = utcToZoned(e.startsAt).date.slice(0, 4) === utcToZoned(now).date.slice(0, 4);
  const day = (d: Date) => (sameYear ? dayFmt : dayYearFmt).format(d);
  const startDay = utcToZoned(e.startsAt).date;
  const endDay = e.endsAt ? utcToZoned(e.endsAt).date : startDay;
  const startTime = e.allDay ? null : timeFmt.format(e.startsAt);
  const endTime = e.endsAt && !(e.allDay && utcToZoned(e.endsAt).time === '23:59') ? timeFmt.format(e.endsAt) : null;

  if (startDay === endDay) {
    const times = startTime ? (endTime ? `${startTime} – ${endTime}` : startTime) : null;
    return times ? `${day(e.startsAt)} · ${times}` : day(e.startsAt);
  }
  const from = startTime ? `${day(e.startsAt)}, ${startTime}` : day(e.startsAt);
  const to = e.endsAt ? (endTime ? `${day(e.endsAt)}, ${endTime}` : day(e.endsAt)) : '';
  return `${from} – ${to}`;
}

/** Only same-site paths under /place/ may be used as a post-login destination. */
export function safePlaceNext(next: string | null | undefined): string | null {
  if (!next) return null;
  return /^\/place\/[a-zA-Z0-9/_-]*$/.test(next) && !next.includes('//') ? next : null;
}
