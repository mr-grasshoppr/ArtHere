import { describe, expect, it } from 'vitest';
import { diffAffiliations, rowKey, type HistoryRow } from '../affiliation-history';

const row = (over: Partial<HistoryRow> = {}): HistoryRow => ({ placeId: 'p1', venueName: null, relationship: 'STUDENT', relationshipLabel: null, ...over });

describe('diffAffiliations', () => {
  it('records nothing when nothing changed', () => {
    expect(diffAffiliations([row()], [row()])).toEqual([]);
  });

  it('records a new role as ADDED', () => {
    expect(diffAffiliations([], [row()]).map((c) => c.action)).toEqual(['ADDED']);
  });

  it('keeps the fact of an affiliation when it is deleted', () => {
    const changes = diffAffiliations([row()], []);
    expect(changes).toEqual([{ action: 'REMOVED', row: row() }]);
  });

  it('records student → member as a REMOVED and an ADDED, and keeps both', () => {
    const changes = diffAffiliations([row({ relationship: 'STUDENT' })], [row({ relationship: 'STUDENT' }), row({ relationship: 'MEMBER' })]);
    expect(changes.map((c) => `${c.action}:${c.row.relationship}`)).toEqual(['ADDED:MEMBER']);
    const swapped = diffAffiliations([row({ relationship: 'STUDENT' })], [row({ relationship: 'MEMBER' })]);
    expect(swapped.map((c) => `${c.action}:${c.row.relationship}`).sort()).toEqual(['ADDED:MEMBER', 'REMOVED:STUDENT']);
  });

  it('records a changed title, ignoring whitespace', () => {
    expect(diffAffiliations([row({ relationshipLabel: 'Founder' })], [row({ relationshipLabel: ' Founder ' })])).toEqual([]);
    expect(diffAffiliations([row({ relationshipLabel: null })], [row({ relationshipLabel: 'Founder' })]).map((c) => c.action)).toEqual(['TITLE_CHANGED']);
  });

  it('tracks typed venues by name, case-insensitively', () => {
    const typed = row({ placeId: null, venueName: 'Imperfecta' });
    expect(diffAffiliations([typed], [{ ...typed, venueName: 'imperfecta' }])).toEqual([]);
    expect(rowKey(typed)).not.toBe(rowKey(row()));
  });
});
