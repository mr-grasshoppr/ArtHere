import { describe, expect, it } from 'vitest';
import { formatEventWhen, normalizeEventLink, isUpcoming, parseEventInput, safePlaceNext, utcToZoned, zonedToUtc } from '../events';

const base = { name: 'Opening', startDate: '2026-11-07', startTime: '19:00', endDate: '', endTime: '21:00', description: 'An evening of new work.', price: 'Free', audience: 'All ages', link: 'https://example.org/open' };

describe('zonedToUtc', () => {
  it('converts Pacific standard and daylight time', () => {
    expect(zonedToUtc('2026-11-07', '19:00')?.toISOString()).toBe('2026-11-08T03:00:00.000Z'); // PST, UTC-8
    expect(zonedToUtc('2026-07-04', '19:00')?.toISOString()).toBe('2026-07-05T02:00:00.000Z'); // PDT, UTC-7
  });
  it('round-trips through utcToZoned', () => {
    expect(utcToZoned(zonedToUtc('2026-11-07', '19:30')!)).toEqual({ date: '2026-11-07', time: '19:30' });
  });
  it('rejects impossible dates', () => {
    expect(zonedToUtc('2026-02-30', '10:00')).toBeNull();
    expect(zonedToUtc('nope', '10:00')).toBeNull();
  });
});

describe('parseEventInput', () => {
  it('requires a name', () => {
    expect(parseEventInput({ ...base, name: '  ' }).ok).toBe(false);
  });
  it('requires start and end times, price, audience, description and a link', () => {
    for (const patch of [{ startTime: '' }, { endTime: '' }, { price: ' ' }, { audience: '' }, { link: '' }, { description: '  ' }]) {
      expect(parseEventInput({ ...base, ...patch }).ok).toBe(false);
    }
  });
  it('caps the description at about a paragraph', () => {
    expect(parseEventInput({ ...base, description: 'x'.repeat(451) }).ok).toBe(false);
    expect(parseEventInput({ ...base, description: 'x'.repeat(450) }).ok).toBe(true);
  });
  it('rejects an end before the start', () => {
    expect(parseEventInput({ ...base, endDate: '2026-11-06' }).ok).toBe(false);
    expect(parseEventInput({ ...base, endTime: '18:00' }).ok).toBe(false);
  });
  it('lets an end time alone mean the same day', () => {
    const r = parseEventInput({ ...base, endTime: '21:00' });
    expect(r.ok && r.value.endsAt?.toISOString()).toBe('2026-11-08T05:00:00.000Z');
  });
});

describe('formatEventWhen', () => {
  const now = new Date('2026-10-19T12:00:00Z');
  it('formats a single evening with a time range', () => {
    const r = parseEventInput({ ...base, endTime: '21:00' });
    if (!r.ok) throw new Error('bad');
    expect(formatEventWhen(r.value, now)).toBe('Sat, Nov 7 · 7:00 PM – 9:00 PM');
  });
  it('formats a multi-day run', () => {
    const r = parseEventInput({ ...base, endDate: '2026-11-09' });
    if (!r.ok) throw new Error('bad');
    expect(formatEventWhen(r.value, now)).toBe('Sat, Nov 7, 7:00 PM – Mon, Nov 9, 9:00 PM');
  });
});

describe('isUpcoming', () => {
  it('stays upcoming through the event day when there is no end', () => {
    const e = { startsAt: new Date('2026-11-08T03:00:00Z'), endsAt: null };
    expect(isUpcoming(e, new Date('2026-11-08T10:00:00Z'))).toBe(true);
    expect(isUpcoming(e, new Date('2026-11-10T00:00:00Z'))).toBe(false);
  });
});

describe('safePlaceNext', () => {
  it('only allows /place/ paths', () => {
    expect(safePlaceNext('/place/events/new')).toBe('/place/events/new');
    expect(safePlaceNext('https://evil.com')).toBeNull();
    expect(safePlaceNext('//evil.com')).toBeNull();
    expect(safePlaceNext('/admin')).toBeNull();
  });
});

describe('normalizeEventLink', () => {
  it('adds https and rejects non-web or malformed links', () => {
    expect(normalizeEventLink('example.org/open-house')).toBe('https://example.org/open-house');
    expect(normalizeEventLink('  ')).toBeNull();
    expect(normalizeEventLink('javascript:alert(1)')).toBeNull();
    expect(normalizeEventLink('notaurl')).toBeNull();
  });
  it('rejects a bad link when parsing an event', () => {
    expect(parseEventInput({ ...base, link: 'javascript:alert(1)' }).ok).toBe(false);
    const r = parseEventInput({ ...base, link: 'example.org' });
    expect(r.ok && r.value.linkUrl).toBe('https://example.org/');
  });
});
