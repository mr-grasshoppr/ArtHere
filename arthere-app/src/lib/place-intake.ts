import { isValidEmail } from '@/lib/email';

/** How a space supports local artists: the self-certification checkboxes on the places page. */
export const SUPPORT_CRITERIA = [
  { id: 'exhibitions', title: 'Regularly show or sell work from at least 3 local artists per year.' },
  {
    id: 'paid-programming',
    title: 'Hire at least 3 local creatives annually for paid live performances, workshops, residencies, or site-specific art.',
  },
  {
    id: 'artist-access',
    title: 'Provide ongoing artist discounts, subsidized workspace, rehearsal access, or supply grants.',
  },
] as const;

/**
 * The ways a place works with artists, matching the relationship types on artist and place profiles
 * (instructors, students, exhibiting artists, members, sales, grants) plus a plain "space" option.
 */
export const ARTIST_WAYS = [
  { id: 'exhibits', label: 'Exhibits', prompt: 'Artists who exhibit with us' },
  { id: 'sales', label: 'Sales', prompt: 'Artists whose work we sell' },
  { id: 'space', label: 'Space', prompt: 'Artists who use our studio, rehearsal or workspace' },
  { id: 'instructors', label: 'Instructors', prompt: 'Artists who teach here' },
  { id: 'students', label: 'Students', prompt: 'Artists who study here' },
  { id: 'grants', label: 'Grants', prompt: 'Artists we have given grants to' },
  { id: 'other', label: 'Other', prompt: 'Any other way we support artists' },
] as const;

export type SupportCriterionId = (typeof SUPPORT_CRITERIA)[number]['id'];

export type PlaceIntake = {
  spaceName: string;
  address: string;
  neighborhood: string;
  website: string;
  contactName: string;
  email: string;
  support: string[];
  /** Selected ways of working with artists (ARTIST_WAYS ids), each with an optional list of artist names. */
  ways: Record<string, string>;
  howYouSupport: string;
};

export type PlaceIntakeErrors = Partial<Record<keyof PlaceIntake, string>>;

/** Used by the form (live) and the API route (authoritative), so both agree. */
export function validatePlaceIntake(v: PlaceIntake): PlaceIntakeErrors {
  const errors: PlaceIntakeErrors = {};
  if (!v.spaceName.trim()) errors.spaceName = 'Enter the name of your place, organization, or business.';
  if (!v.address.trim()) errors.address = 'Enter your address.';
  if (!v.neighborhood.trim()) errors.neighborhood = 'Enter your neighborhood.';
  if (v.contactName.trim().split(/\s+/).filter(Boolean).length < 2) errors.contactName = 'Enter your first and last name.';
  if (!v.email.trim()) errors.email = 'Enter your email address.';
  else if (!isValidEmail(v.email.trim())) errors.email = 'Enter a valid email address.';
  const known = new Set<string>(SUPPORT_CRITERIA.map(c => c.id));
  if (!v.support.some(id => known.has(id))) errors.support = 'Check at least one way you support local artists.';
  return errors;
}
