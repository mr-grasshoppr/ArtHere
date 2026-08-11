// Presentation helpers for artist profile pages.

/**
 * Turn a stored hireFor string ("Buying existing artwork, Custom work, …")
 * into a friendly sentence: "Kurtis sells artwork, takes commissions, and
 * teaches." Takes the first name directly rather than splitting a full name
 * — a caller passing "Mary Ann Smith" and expecting "Mary Ann" would have
 * been mangled to "Mary" by a naive whitespace split.
 */
export function hireForSentence(firstName: string, hireFor: string): string {
  const items = hireFor.split(/ · |, /).map(s => s.trim()).filter(Boolean);
  const verbs = items.map(item => {
    const l = item.toLowerCase();
    if (l.includes('sell') || l.includes('buying existing') || l.includes('existing artwork')) return 'sells artwork';
    if (l.includes('custom work') || l.includes('commission')) return 'takes commissions';
    if (l.includes('teach') || l.includes('classes') || l.includes('lessons') || l.includes('workshop')) return 'teaches';
    if (l.includes('consultation')) return 'offers consultations';
    return l;
  });
  const unique = [...new Set(verbs)];
  if (unique.length === 0) return '';
  if (unique.length === 1) return `${firstName} ${unique[0]}.`;
  const last = unique[unique.length - 1];
  return `${firstName} ${unique.slice(0, -1).join(', ')}, and ${last}.`;
}

/** Human-readable platform name for a social URL (or bare Instagram handle). */
export function socialPlatformName(url: string): string {
  if (!url.startsWith('http')) return 'Instagram';
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('etsy.com')) return 'Etsy';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'X';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('pinterest.com')) return 'Pinterest';
    if (host.includes('behance.net')) return 'Behance';
    if (host.includes('youtube.com')) return 'YouTube';
    return 'Social media';
  } catch { return 'Social media'; }
}
