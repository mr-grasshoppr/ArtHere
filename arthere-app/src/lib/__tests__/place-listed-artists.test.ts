import { describe, expect, it } from 'vitest';
import { groupsFromRows, groupsToPayload, parseNames } from '../place-listed-artists';

describe('parseNames', () => {
  it('splits on lines and commas, trims, and drops blanks', () => {
    expect(parseNames('Ana Ruiz\n  Bo  Lee ,, Cy\r\n\n')).toEqual(['Ana Ruiz', 'Bo Lee', 'Cy']);
  });
  it('drops case-insensitive repeats, keeping the first spelling', () => {
    expect(parseNames('Ana Ruiz\nana ruiz\nBo')).toEqual(['Ana Ruiz', 'Bo']);
  });
  it('caps name length', () => {
    expect(parseNames('x'.repeat(500))[0]).toHaveLength(120);
  });
});

describe('groups', () => {
  it('round-trips saved rows through editor text to a payload without empty groups', () => {
    const state = groupsFromRows([
      { name: 'Ana', relationship: 'IN_SHOP', relationshipLabel: null },
      { name: 'Bo', relationship: 'IN_SHOP', relationshipLabel: null },
      { name: 'Cy', relationship: 'OTHER', relationshipLabel: 'Alumni' },
    ]);
    expect(groupsToPayload(state)).toEqual([
      { relationship: 'IN_SHOP', label: '', names: ['Ana', 'Bo'] },
      { relationship: 'OTHER', label: 'Alumni', names: ['Cy'] },
    ]);
  });
});
