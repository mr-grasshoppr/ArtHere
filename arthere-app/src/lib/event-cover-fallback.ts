/** Art Here template covers, used when an event has no photo of its own. */
export const EVENT_TEMPLATE_COVERS = [
  '/images/event-templates/template-1.jpg',
  '/images/event-templates/template-2.jpg',
  '/images/event-templates/template-3.jpg',
  '/images/event-templates/template-4.jpg',
];

/** The event's own cover, or a template picked deterministically from its id so it never changes between renders. */
export function eventCoverUrl(event: { id: string; coverImageUrl: string | null }): string {
  if (event.coverImageUrl) return event.coverImageUrl;
  let h = 0;
  for (const ch of event.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return EVENT_TEMPLATE_COVERS[h % EVENT_TEMPLATE_COVERS.length];
}
