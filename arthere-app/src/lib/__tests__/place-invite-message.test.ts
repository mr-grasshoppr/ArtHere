import { describe, expect, it } from 'vitest';
import { inviteJoinUrl, inviteMailto, inviteMessage } from '../place-invite-message';

describe('place invite message', () => {
  const base = { placeName: 'Village Frame', baseUrl: 'https://artishere.org/', placeSlug: 'village-frame' };
  it('addresses the artist, signs as the place, and links join + FAQ', () => {
    const m = inviteMessage({ ...base, artistName: ' Ana ' });
    expect(m).toContain('Hi Ana,');
    expect(m).toContain('Village Frame is now featured');
    expect(m).toContain('https://artishere.org/onboarding?ref=village-frame');
    expect(m).toContain('https://artishere.org/faq');
    expect(m.trim().endsWith('Village Frame')).toBe(true);
  });
  it('leaves a visible blank when no name is given', () => {
    expect(inviteMessage(base)).toContain('Hi [Artist Name],');
  });
  it('encodes the slug and mailto parts', () => {
    expect(inviteJoinUrl('https://x.org', 'a b')).toBe('https://x.org/onboarding?ref=a%20b');
    expect(inviteMailto('A & B', 'x\ny')).toBe('mailto:?subject=A%20%26%20B&body=x%0Ay');
  });
});
