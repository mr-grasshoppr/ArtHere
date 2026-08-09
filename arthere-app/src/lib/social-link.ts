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
