const MAX_DESCRIPTION = 155;

/** Collapse whitespace and trim to a search-snippet length, ending on a word. */
export function snippet(text: string | null | undefined, max = MAX_DESCRIPTION): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\s]+$/, '')}…`;
}

/** Serialize JSON-LD for a <script> tag; escapes `<` so content can't close it. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function artistDescription(a: {
  name: string;
  bio?: string | null;
  medium?: string | null;
  neighborhood?: string | null;
  cityLabel?: string;
}): string {
  const fromBio = snippet(a.bio);
  if (fromBio) return fromBio;
  const where = [a.neighborhood, a.cityLabel].filter(Boolean).join(', ');
  const what = a.medium ? `${a.medium} artist` : 'artist';
  return snippet(`${a.name} is a ${what}${where ? ` in ${where}` : ''}. See their work and get in touch on Art Here.`);
}

export function placeDescription(p: {
  name: string;
  description?: string | null;
  neighborhood?: string | null;
  cityLabel?: string;
}): string {
  const fromText = snippet(p.description);
  if (fromText) return fromText;
  const where = [p.neighborhood, p.cityLabel].filter(Boolean).join(', ');
  return snippet(`${p.name}${where ? ` in ${where}` : ''} — a place that shows and supports local artists, on Art Here.`);
}

export function cityDescription(label: string, description?: string | null): string {
  return snippet(description) || `Local ${label} artists and the places that support them — browse the artwork, meet the artists and explore the map.`;
}

/** Only absolute http(s) URLs belong in `sameAs`. */
export function sameAsUrls(urls: (string | null | undefined)[]): string[] {
  return [...new Set(urls.filter((u): u is string => !!u && /^https?:\/\//i.test(u.trim())).map(u => u.trim()))];
}

export function instagramUrl(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const h = handle.trim();
  if (/^https?:\/\//i.test(h)) return h;
  const user = h.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '').replace(/\/+$/, '');
  return user ? `https://www.instagram.com/${user}` : null;
}
