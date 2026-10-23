import { describe, expect, it } from 'vitest';
import { EVENT_TEMPLATE_COVERS, eventCoverUrl } from '../event-cover-fallback';

describe('eventCoverUrl', () => {
  it('prefers the event’s own photo', () => {
    expect(eventCoverUrl({ id: 'a', coverImageUrl: 'https://x/y.jpg' })).toBe('https://x/y.jpg');
  });
  it('falls back to a stable template', () => {
    const e = { id: 'cmvh1516e0001n3s9oretibd1', coverImageUrl: null };
    expect(EVENT_TEMPLATE_COVERS).toContain(eventCoverUrl(e));
    expect(eventCoverUrl(e)).toBe(eventCoverUrl(e));
  });
});
