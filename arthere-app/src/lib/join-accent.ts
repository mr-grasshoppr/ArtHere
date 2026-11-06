/**
 * Each "Join us" page gets its own look so they don't read as the same form:
 * a big audience word, and one accent colour that the form's steps, buttons,
 * chips and focus rings pick up (as the --accent CSS variable). Pink, green and
 * chartreuse are the brand palette; Cities uses white with the brand gradient
 * on its word.
 */
export type JoinAccent = {
  /** The big header word. */
  word: string;
  /** UI accent: buttons, step markers, chips, focus rings. */
  color: string;
  /** Optional gradient for the header word (defaults to the accent colour). */
  wordGradient?: string;
};

export const JOIN_ACCENTS: Record<string, JoinAccent> = {
  artists: { word: 'Artists', color: '#f96a9b' },
  places: { word: 'Places', color: '#07b26b' },
  organizations: { word: 'Partners', color: '#bdd349' },
  cities: {
    word: 'Cities',
    color: '#ffffff',
    wordGradient: 'linear-gradient(90deg, #f96a9b 0%, #07b26b 55%, #bdd349 100%)',
  },
};
