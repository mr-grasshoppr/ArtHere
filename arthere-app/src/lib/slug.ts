/** URL-safe slug from a display name: "Kurtis Piltz" → "kurtis-piltz". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
