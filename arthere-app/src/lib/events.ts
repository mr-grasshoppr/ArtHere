// Helpers for org events. Dates are typed and shown in one site timezone and
// stored as UTC, so a 7pm opening reads as 7pm to everyone regardless of
// where the server (or the visitor's browser) happens to be.

// TODO: move onto City once there is more than one real city.
export const EVENT_TIMEZONE = 'America/Los_Angeles';

export const EVENT_NAME_MAX = 120;
export const EVENT_DESCRIPTION_MAX = 1000;

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
  startTime: string; // blank = all day
  endDate: string;   // blank = no end
  endTime: string;
  description: string;
}

export type ParsedEvent =
  | { ok: true; value: { name: string; startsAt: Date; endsAt: Date | null; allDay: boolean; description: string | null } }
  | { ok: false; error: string };

export function parseEventInput(input: EventFormInput): ParsedEvent {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Please give the event a name.' };
  if (name.length > EVENT_NAME_MAX) return { ok: false, error: `Event names are limited to ${EVENT_NAME_MAX} characters.` };
  const description = input.description.trim();
  if (description.length > EVENT_DESCRIPTION_MAX) return { ok: false, error: `Descriptions are limited to ${EVENT_DESCRIPTION_MAX} characters.` };

  const allDay = !input.startTime.trim();
  const startsAt = zonedToUtc(input.startDate, allDay ? '00:00' : input.startTime);
  if (!startsAt) return { ok: false, error: 'Please enter a valid start date.' };

  let endsAt: Date | null = null;
  if (input.endDate.trim() || input.endTime.trim()) {
    // A time with no end date means "same day".
    const endDate = input.endDate.trim() || input.startDate;
    endsAt = zonedToUtc(endDate, input.endTime.trim() || (allDay ? '23:59' : '23:59'));
    if (!endsAt) return { ok: false, error: 'Please enter a valid end date.' };
    if (endsAt < startsAt) return { ok: false, error: 'The event can’t end before it starts.' };
  }
  return { ok: true, value: { name, startsAt, endsAt, allDay, description: description || null } };
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
