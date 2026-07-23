// Single source of truth for PDX Community Survey option strings.
//
// These exact strings are stored in SurveyResponse rows, so the survey form,
// the /api/survey route, and the admin dashboards must all import from here —
// a mismatched literal silently miscounts stats (this happened: the admin
// funnel compared against "No, I'm not making art" while the form stored "No").

export const OTHER = 'Other';
export const NONE_OF_THE_ABOVE = 'None of the above';
export const PREFER_NOT = 'Prefer not to say';

// ─── About You ───────────────────────────────────────────────────────────────

export const OCCUPATION_OTHER = OTHER;
export const OCCUPATION_PREFER_NOT = PREFER_NOT;
export const OCCUPATION_PINNED = ['Not currently working', 'Retired', OCCUPATION_OTHER, OCCUPATION_PREFER_NOT];
export const OCCUPATION_OPTIONS = [
  'Arts (Visual Art, Dance, Music, Theater)',
  'Business or Professional Services',
  'Design or Creative Services',
  'Education',
  'Federal or State Government',
  'Healthcare',
  'Homemaker',
  'Local Government (City or County)',
  'Non-profit',
  'Technology',
  'Trades or Manufacturing',
  'Not currently working',
  'Retired',
  OCCUPATION_OTHER,
  OCCUPATION_PREFER_NOT,
];

/** artistStatus value meaning "does not make art" — everything else (except empty) is an artist. */
export const NOT_MAKING_ART = 'No';
export const ARTIST_STATUS_OPTIONS = [
  'Yes, it is my primary occupation',
  'Yes, I have an active art practice alongside other work',
  `Yes, I'm an art student`,
  'Yes, for fun or as a hobby',
  NOT_MAKING_ART,
  OTHER,
];

export const ART_MEDIUM_OTHER = OTHER;
export const ART_MEDIUM_PREFER_NOT = PREFER_NOT;
export const ART_MEDIUM_OPTIONS = [
  'Ceramics',
  'Dance',
  'Digital Art / New Media',
  'Drawing',
  'Film / Video',
  'Illustration',
  'Music',
  'Painting',
  'Photography',
  'Sculpture',
  'Textiles',
  'Theater / Performance',
  'Woodworking',
  'Writing / Literary Arts',
  ART_MEDIUM_OTHER,
  ART_MEDIUM_PREFER_NOT,
];

// ─── About Portland ──────────────────────────────────────────────────────────

export const PORTLAND_FAMILIARITY_OPTIONS = [
  'Not at all interested',
  'Slightly interested',
  'Moderately interested',
  'Very interested',
  'Extremely interested',
];

export const DISCOVERY_EASE_OPTIONS = [
  'Very difficult',
  'Somewhat difficult',
  'Neither easy nor difficult',
  'Somewhat easy',
  'Very easy',
];

export const DISCOVERY_CHANNEL_OTHER = OTHER;
export const DISCOVERY_CHANNEL_OPTIONS = [
  'Shops',
  'Galleries',
  'Social media',
  'Art events',
  'Flyers in public places',
  'Friends, Family, or Word of Mouth',
  DISCOVERY_CHANNEL_OTHER,
];

export const PORTLAND_SUPPORT_OTHER = OTHER;
export const PORTLAND_SUPPORT_NONE = NONE_OF_THE_ABOVE;
export const PORTLAND_SUPPORT_OPTIONS = [
  'Purchase artwork',
  'Hire or commission artwork',
  'Collaborate with artists',
  'Attend events',
  'Visit galleries or shows',
  "Share artists' work",
  'Volunteer',
  PORTLAND_SUPPORT_OTHER,
  PORTLAND_SUPPORT_NONE,
];

// ─── Practice ────────────────────────────────────────────────────────────────

export const CAREER_STAGE_OTHER = 'Other (please specify)';
export const CAREER_STAGE_OPTIONS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '6–10 years',
  '11–15 years',
  '15+ years',
  CAREER_STAGE_OTHER,
];

export const PRACTICE_ACTIVITY_OPTIONS = [
  'Sold original artwork',
  'Completed commissions for my artwork',
  'Shown my artwork in galleries, shows, or public events',
  'Performed or presented art publicly',
  'Applied for an artist grant or residency',
  'Received an artist grant or residency',
  'Collaborated with other artists or organizations',
  'Taken a class or training to support my art practice',
  OTHER,
  NONE_OF_THE_ABOVE,
];

export const PRACTICE_GOAL_OPTIONS = [
  'Sell my artwork',
  'Find more commissions',
  'Share or promote my art',
  'Connect with other local artists',
  'Show my artwork in galleries, shows, or public events',
  'Find studio space or places to make my work',
  'Receive an artist grant or residency',
  'Collaborate with other artists',
  'Take classes or training to support my art practice',
  OTHER,
];

// ─── Get Involved ────────────────────────────────────────────────────────────

export const INVOLVEMENT_OTHER = OTHER;
export const INVOLVEMENT_NONE = NONE_OF_THE_ABOVE;
/** Selecting this (plus leaving an email) provisions an artist account + magic link. */
export const INVOLVEMENT_FEATURED = 'Showcase my work on the Art Here platform';
export const INVOLVEMENT_NEWS = 'Keep me posted on Art Here news';
export const INVOLVEMENT_VOLUNTEER = 'Volunteer to help Art Here';
export const INVOLVEMENT_PARADE = 'Join the parade at Multnomah Days 2026 (August 15, Portland)';
export const INVOLVEMENT_PARTNER = 'Partner or collaborate';
export const INVOLVEMENT_OPTIONS = [
  INVOLVEMENT_NEWS,
  INVOLVEMENT_FEATURED,
  INVOLVEMENT_VOLUNTEER,
  INVOLVEMENT_PARADE,
  INVOLVEMENT_PARTNER,
  INVOLVEMENT_OTHER,
  INVOLVEMENT_NONE,
];

// ─── Wrap-up ─────────────────────────────────────────────────────────────────

export const RAFFLE_YES = 'Yes';
export const RAFFLE_OPTIONS = [RAFFLE_YES, 'No'];

export const LEARNED_ABOUT_OTHER = OTHER;
export const LEARNED_ABOUT_OPTIONS = [
  'Multnomah Arts Center',
  'Local business',
  'Local art gallery',
  'Flyers in public places',
  'Friends, Family, or Word of Mouth',
  LEARNED_ABOUT_OTHER,
];
