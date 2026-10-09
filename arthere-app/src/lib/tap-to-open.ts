// Tap-to-open, for the map tab's dots on a touchscreen: the first tap shows
// the dot's card, and only a separate, later tap on the same dot (or on the
// card) opens its page. Phones have no hover, so without this a single tap
// went straight to the page before the visitor saw what they'd tapped.

/**
 * How long the card has to have been showing before a second tap opens the
 * page. A quick double-tap lands inside it and just shows the card — the
 * visitor gets to see it before deciding.
 */
export const TAP_OPEN_DELAY_MS = 400;

/** True on devices with no hover (phones, most tablets). */
export function isTouchOnly(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
}
