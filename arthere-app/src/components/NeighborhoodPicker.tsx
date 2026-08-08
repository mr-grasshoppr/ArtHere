'use client';

import { useState } from 'react';
import { MENU_THEME, PILL_BASE } from './FilterDropdown';
import { normalizeNeighborhood } from '@/lib/neighborhoods';

const t = MENU_THEME.light;

/**
 * Dropdown for picking one or more neighborhoods — checkboxes for known
 * values (pulled from getKnownNeighborhoods) plus a text field to add one
 * that isn't in the list yet. Used on the org editors; value/onChange work
 * with the same comma-joined-string convention as Artist.medium (see
 * parseNeighborhoodList/joinNeighborhoodList in lib/neighborhoods.ts) —
 * callers own converting to/from that string at the save boundary.
 */
export function NeighborhoodPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState('');

  const buttonLabel = value.length === 0 ? 'Select neighborhoods…' : value.join(', ');

  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  }

  function addNew() {
    const clean = normalizeNeighborhood(newValue);
    if (clean && !value.includes(clean)) onChange([...value, clean]);
    setNewValue('');
  }

  // Anything the user already added that isn't in the known options list
  // (e.g. just typed) still needs its own checked row so it's visible/removable.
  const allOptions = [...new Set([...options, ...value])].sort();

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${PILL_BASE} border-[#e5e5e5] text-left w-full flex items-center justify-between gap-2 ${value.length === 0 ? 'text-[#bbb]' : 'text-[#1a1a1a]'}`}
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="text-[#999] flex-shrink-0">▾</span>
      </button>

      {open && (
        <div className={`absolute top-[calc(100%+6px)] left-0 w-full min-w-[260px] z-50 ${t.menu}`}>
          <div className="max-h-[240px] overflow-y-auto">
            {allOptions.length === 0 && <div className={t.empty}>No neighborhoods yet</div>}
            {allOptions.map(opt => {
              const on = value.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`${t.item} ${on ? t.itemOn : t.itemOff} flex items-center gap-2`}
                >
                  <span
                    className={`inline-block w-3 h-3 rounded-sm border flex-shrink-0 ${
                      on ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-[#ccc]'
                    }`}
                  />
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 p-2 border-t border-[#f0f0f0]" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addNew();
                }
              }}
              placeholder="Add a new neighborhood…"
              className="flex-1 min-w-0 px-2.5 py-1.5 border border-[#e5e5e5] rounded-md text-[0.82rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999]"
            />
            <button
              type="button"
              onClick={addNew}
              disabled={!newValue.trim()}
              className="text-[0.82rem] px-2.5 py-1.5 rounded-md border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
