import { LinkType } from "@prisma/client";

const DOMAIN_TYPES: Record<string, LinkType> = {
  "instagram.com": LinkType.INSTAGRAM,
  "facebook.com": LinkType.FACEBOOK,
};

// Best-effort turn the contact form's free-text "website or social media"
// field into a single ArtistLink. Returns null when the text isn't
// confidently link-shaped (e.g. "DM me on IG") — callers should preserve the
// raw text elsewhere (an admin note) so nothing is lost when this misses.
export function classifySocialLink(raw: string | null | undefined): { type: LinkType; url: string } | null {
  const text = raw?.trim();
  if (!text) return null;

  const handle = text.match(/^@([\w.]+)$/);
  if (handle) return { type: LinkType.INSTAGRAM, url: `https://instagram.com/${handle[1]}` };

  const hasScheme = /^https?:\/\//i.test(text);
  const looksLikeDomain = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text);
  if (!hasScheme && !looksLikeDomain) return null;

  const withScheme = hasScheme ? text : `https://${text}`;
  try {
    const host = new URL(withScheme).hostname.replace(/^www\./, "");
    return { type: DOMAIN_TYPES[host] ?? LinkType.WEBSITE, url: withScheme };
  } catch {
    return null;
  }
}

/**
 * Turn a Links-editor URL field into something a browser can actually
 * follow: add https:// to a bare "www.site.com" / "site.com/path", or
 * expand an Instagram-style "@handle" into a full profile URL. Left alone
 * if it already has a scheme, or doesn't look link-shaped — so a stray typo
 * isn't silently rewritten into garbage. Unlike classifySocialLink, the
 * link's type here is already chosen via the dropdown, so this only fixes
 * up the URL rather than inferring a type.
 */
export function normalizeLinkUrl(raw: string): string {
  const text = raw.trim();
  if (!text || /^https?:\/\//i.test(text)) return text;

  const handle = text.match(/^@([\w.]+)$/);
  if (handle) return `https://instagram.com/${handle[1]}`;

  const looksLikeDomain = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text);
  return looksLikeDomain ? `https://${text}` : text;
}
