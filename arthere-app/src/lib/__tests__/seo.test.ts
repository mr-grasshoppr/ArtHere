import { describe, it, expect } from 'vitest';
import { snippet, jsonLdString, artistDescription, sameAsUrls, instagramUrl } from '../seo';

describe('seo helpers', () => {
  it('snippet trims on a word boundary with an ellipsis', () => {
    const out = snippet('word '.repeat(60));
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith('…')).toBe(true);
  });
  it('snippet leaves short text alone', () => {
    expect(snippet('  hello   world ')).toBe('hello world');
    expect(snippet(null)).toBe('');
  });
  it('jsonLdString escapes < so a script tag cannot be closed', () => {
    expect(jsonLdString({ a: '</script>' })).not.toContain('<');
  });
  it('artistDescription falls back to a composed sentence', () => {
    expect(artistDescription({ name: 'Jo', medium: 'Ceramic', cityLabel: 'Portland, OR' })).toBe(
      'Jo is a Ceramic artist in Portland, OR. See their work and get in touch on Art Here.',
    );
  });
  it('sameAsUrls keeps only unique absolute URLs', () => {
    expect(sameAsUrls(['https://a.com', 'https://a.com', 'a.com', null])).toEqual(['https://a.com']);
  });
  it('instagramUrl handles handles and URLs', () => {
    expect(instagramUrl('@jo')).toBe('https://www.instagram.com/jo');
    expect(instagramUrl('https://instagram.com/jo')).toBe('https://instagram.com/jo');
    expect(instagramUrl('')).toBeNull();
  });
});
