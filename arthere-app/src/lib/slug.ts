/** URL-safe slug from a display name: "Kurtis Piltz" → "kurtis-piltz". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slugs minted before a real name existed: "new-artist-5", "new-organization-1", "artist", "venue". */
export function isPlaceholderSlug(slug: string): boolean {
  return /^(new-artist|new-organization|artist|venue)(-\d+)?$/.test(slug);
}
