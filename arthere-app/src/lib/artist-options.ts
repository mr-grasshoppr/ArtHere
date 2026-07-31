// Preset options shown as pills/checkboxes in artist profile editors, so the
// admin editor and the public rendering agree on labels and ordering.

export const MEDIUM_OPTIONS = [
  'Painting',
  'Drawing',
  'Photography',
  'Sculpture',
  'Ceramics',
  'Textiles',
  'Woodworking',
  'New Media',
  'Illustration',
];

export const OFFERING_OPTIONS = [
  { value: 'sell_existing', label: 'Buying existing artwork' },
  { value: 'custom_artwork', label: 'Custom work' },
  { value: 'classes', label: 'Teaching classes, lessons, or workshops' },
  { value: 'consultations', label: 'Consultations' },
];

export const LINK_TYPE_OPTIONS: { value: string; label: string; placeholder: string }[] = [
  { value: 'WEBSITE', label: 'Website', placeholder: 'https://yoursite.com' },
  { value: 'PORTFOLIO', label: 'Portfolio', placeholder: 'https://yourportfolio.com' },
  { value: 'SHOP', label: 'Shop', placeholder: 'https://yourshop.com' },
  { value: 'PATREON', label: 'Patreon', placeholder: 'https://patreon.com/you' },
  { value: 'INSTAGRAM', label: 'Instagram', placeholder: 'https://instagram.com/you' },
  { value: 'FACEBOOK', label: 'Facebook', placeholder: 'https://facebook.com/you' },
  { value: 'OTHER', label: 'Other', placeholder: 'https://…' },
];

export function linkTypeLabel(type: string): string {
  return LINK_TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

// Artist.medium is stored as a comma-joined list ("Painting, Sculpture") since
// an artist can work in more than one medium. Anywhere that filters or lists
// individual mediums (dropdowns, matching) needs the split tokens, not the
// raw joined string — use these two helpers rather than comparing `medium`
// directly, or a multi-medium artist silently drops out of single-medium
// filters.
export function parseMediumList(raw: string | null | undefined): string[] {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function mediumMatches(raw: string | null | undefined, filter: string | null | undefined): boolean {
  if (!filter) return true;
  return parseMediumList(raw).includes(filter);
}

// Builds the flattened sentence stored in Artist.hireFor from the structured
// offerings list, so the existing AI search parsing (which reads hireFor)
// keeps working unchanged.
export function buildHireForText(offerings: string[]): string | null {
  const clean = offerings.map((o) => o.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  return clean.join('. ') + '.';
}
