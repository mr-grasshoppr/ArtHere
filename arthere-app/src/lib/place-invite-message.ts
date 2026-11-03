// The note a place sends to artists it lists but who aren't on Art Here yet.
// Sent from the place's own email (copy / mailto) — never through the site.

export const INVITE_SUBJECT = 'Join our local artist feature on Art Here!';

export function inviteJoinUrl(baseUrl: string, placeSlug: string): string {
  return `${baseUrl.replace(/\/$/, '')}/onboarding?ref=${encodeURIComponent(placeSlug)}`;
}

export function inviteMessage({
  placeName,
  artistName,
  baseUrl,
  placeSlug,
}: {
  placeName: string;
  /** Left as a visible blank when empty, for the place to fill in. */
  artistName?: string;
  baseUrl: string;
  placeSlug: string;
}): string {
  const base = baseUrl.replace(/\/$/, '');
  return `Hi ${artistName?.trim() || '[Artist Name]'},

${placeName} is now featured on Art Here, a local directory celebrating places that support local artists.

As part of our page on the platform, Art Here is extending an invitation for you to be featured in the directory as well. It's completely free and helps connect local art lovers directly to your work.

- Create your profile: Add your bio, work, and links to your website and socials here: ${inviteJoinUrl(base, placeSlug)}
- Learn more: Check out the Art Here FAQ for details on how it works: ${base}/faq

Feel free to reach out if you have any questions!

Best,
${placeName}`;
}

export function inviteMailto(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
