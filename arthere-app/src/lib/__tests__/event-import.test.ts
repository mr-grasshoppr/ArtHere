import { describe, expect, it } from 'vitest';
import { extractPageContent, sanitizeImported } from '../event-import';

describe('extractPageContent', () => {
  const html = `<html><head><title>Open House</title>
    <meta property="og:image" content="/img/flyer.jpg"><meta property="og:description" content="Free night">
    <script type="application/ld+json">{"@type":"Event","name":"Open House"}</script><script>var x=1</script></head>
    <body><h1>Open House</h1><p>Fri Oct 16, 6&ndash;8pm</p><style>.a{}</style></body></html>`;
  it('pulls text, structured data and an absolute og:image', () => {
    const { text, ogImage } = extractPageContent(html, 'https://example.org/events/1');
    expect(ogImage).toBe('https://example.org/img/flyer.jpg');
    expect(text).toContain('"@type":"Event"');
    expect(text).toContain('Fri Oct 16');
    expect(text).not.toContain('var x=1');
  });
});

describe('sanitizeImported', () => {
  it('drops malformed values and clips long text', () => {
    const r = sanitizeImported({ name: 'A'.repeat(500), startDate: 'Oct 16', startTime: '18:00', endTime: '8pm', price: ' Free ', audience: '', description: 'x'.repeat(900), artistNames: ['A B', 3, ' '] }, null);
    expect(r.name).toHaveLength(120);
    expect(r.startDate).toBeNull();
    expect(r.startTime).toBe('18:00');
    expect(r.endTime).toBeNull();
    expect(r.price).toBe('Free');
    expect(r.audience).toBeNull();
    expect(r.description).toHaveLength(450);
    expect(r.artistNames).toEqual(['A B']);
  });
});
