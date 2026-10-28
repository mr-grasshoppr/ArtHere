import { describe, it, expect } from 'vitest';
import { storyVideoEmbedUrl } from '../story-video';

describe('storyVideoEmbedUrl', () => {
  it('handles YouTube watch, short, embed and shorts links', () => {
    const want = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
    expect(storyVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5')).toBe(want);
    expect(storyVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(want);
    expect(storyVideoEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(want);
    expect(storyVideoEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(want);
  });

  it('handles Vimeo links, keeping the privacy hash', () => {
    expect(storyVideoEmbedUrl('https://vimeo.com/123456789')).toBe('https://player.vimeo.com/video/123456789');
    expect(storyVideoEmbedUrl('https://vimeo.com/123456789/abcdef1234')).toBe('https://player.vimeo.com/video/123456789?h=abcdef1234');
  });

  it('rejects other hosts, junk and non-http schemes', () => {
    expect(storyVideoEmbedUrl('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(storyVideoEmbedUrl('javascript:alert(1)')).toBeNull();
    expect(storyVideoEmbedUrl('not a url')).toBeNull();
    expect(storyVideoEmbedUrl('')).toBeNull();
  });
});
