// Pure helpers for the names a place lists by hand. Client-safe: no prisma.

import type { PlaceRelationship } from '@prisma/client';
import { PLACE_RELATIONSHIP_ORDER } from '@/lib/artist-options';

export const MAX_NAME_LENGTH = 120;
export const MAX_NAMES_PER_GROUP = 300;

export type ListedGroup = {
  relationship: PlaceRelationship;
  /** Only used for OTHER. */
  label: string;
  names: string[];
};

/** One name per line, or a comma-separated list; blanks and repeats dropped. */
export function parseNames(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(/[\n\r,]+/)) {
    const name = part.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= MAX_NAMES_PER_GROUP) break;
  }
  return out;
}

/** Saved rows -> the text the editor's textareas start from. */
export function groupsFromRows(
  rows: { name: string; relationship: PlaceRelationship; relationshipLabel: string | null }[],
): Record<PlaceRelationship, { text: string; label: string }> {
  const out = {} as Record<PlaceRelationship, { text: string; label: string }>;
  for (const rel of PLACE_RELATIONSHIP_ORDER) {
    const mine = rows.filter(r => r.relationship === rel);
    out[rel] = { text: mine.map(r => r.name).join('\n'), label: mine.find(r => r.relationshipLabel)?.relationshipLabel ?? '' };
  }
  return out;
}

export function groupsToPayload(state: Record<PlaceRelationship, { text: string; label: string }>): ListedGroup[] {
  return PLACE_RELATIONSHIP_ORDER.map(rel => ({
    relationship: rel,
    label: state[rel].label.trim(),
    names: parseNames(state[rel].text),
  })).filter(g => g.names.length > 0);
}
