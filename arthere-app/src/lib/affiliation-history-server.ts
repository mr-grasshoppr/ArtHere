import { prisma } from '@/lib/db';
import type { AffiliationAction, AffiliationSource } from '@prisma/client';
import { diffAffiliations, type HistoryChange, type HistoryRow } from '@/lib/affiliation-history';

type Event = { action: AffiliationAction; row: HistoryRow };

/**
 * Append events to the permanent affiliation history. Logging must never
 * break the edit it describes (and the table may not exist yet while a deploy
 * and its migration are in flight), so failures are reported but swallowed.
 */
export async function recordAffiliationEvents(
  artist: { id: string; name: string },
  source: AffiliationSource,
  events: Event[],
): Promise<void> {
  if (events.length === 0) return;
  try {
    const ids = [...new Set(events.map(e => e.row.placeId).filter((id): id is string => !!id))];
    const places = ids.length ? await prisma.place.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
    const names = new Map(places.map(p => [p.id, p.name]));
    await prisma.affiliationHistory.createMany({
      data: events.map(e => ({
        artistId: artist.id,
        artistName: artist.name,
        placeId: e.row.placeId,
        placeName: (e.row.placeId ? names.get(e.row.placeId) : null) ?? e.row.venueName ?? 'Unknown',
        relationship: e.row.relationship,
        title: e.row.relationshipLabel?.trim() || null,
        action: e.action,
        source,
      })),
    });
  } catch (err) {
    console.error('affiliation history write failed', err);
  }
}

/** Record what a profile save changed, given the rows before and after. */
export function recordAffiliationDiff(
  artist: { id: string; name: string },
  source: AffiliationSource,
  prior: HistoryRow[],
  next: HistoryRow[],
): Promise<void> {
  const changes: HistoryChange[] = diffAffiliations(prior, next);
  return recordAffiliationEvents(artist, source, changes);
}
