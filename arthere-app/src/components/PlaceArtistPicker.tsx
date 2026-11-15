'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlaceRelationship } from '@prisma/client';
import { PLACE_GROUP_HEADINGS, PLACE_RELATIONSHIP_ORDER } from '@/lib/artist-options';

export type ConnectedArtist = {
  connectionId: string;
  slug: string;
  name: string;
  relationship: PlaceRelationship;
  relationshipLabel: string | null;
};

type Candidate = { id: string; name: string; slug: string; medium: string | null; neighborhood: string | null };

/**
 * Search-as-you-type for connecting an artist who is already on Art Here.
 * Only existing profiles can be picked — nothing typed is ever saved as a
 * name. Artists who aren't on the site yet go through the invite box instead.
 */
export function PlaceArtistPicker({
  placeId,
  connectedSlugs,
  onAdded,
  fieldClassName,
}: {
  /** Only admins need this; a place editor's page comes from their session. */
  placeId?: string;
  connectedSlugs: string[];
  onAdded: (a: ConnectedArtist) => void;
  fieldClassName: string;
}) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [relationship, setRelationship] = useState<PlaceRelationship>('EXHIBITING_ARTIST');
  const [label, setLabel] = useState('');
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const q = text.trim();
    if (picked || q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const mine = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/place/artist-lookup?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { artists: Candidate[] };
        if (mine !== reqId.current) return; // a newer keystroke superseded this one
        setResults(data.artists);
        setActive(0);
        setSearched(true);
      } catch {
        if (mine === reqId.current) setSearched(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [text, picked]);

  // Already-listed artists stay selectable: an artist can hold several roles
  // at one place (student, then member, then instructor…).
  const available = results;

  function choose(c: Candidate) {
    setPicked(c);
    setText(c.name);
    setResults([]);
    setError(null);
  }

  function reset() {
    setPicked(null);
    setText('');
    setLabel('');
    setError(null);
  }

  async function add() {
    if (!picked) return;
    if (relationship === 'OTHER' && !label.trim()) {
      setError('Add a short title for "Other", e.g. Residency alumni.');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/place/artist-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: picked.id, relationship, relationshipLabel: label, placeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't add that artist — please try again.");
      onAdded(data.connection as ConnectedArtist);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that artist — please try again.");
    }
    setAdding(false);
  }

  return (
    <div>
      <div className="relative">
        <input
          value={text}
          onChange={e => {
            setPicked(null);
            setText(e.target.value);
          }}
          onKeyDown={e => {
            if (picked || available.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive(i => Math.min(i + 1, available.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              choose(available[active]);
            } else if (e.key === 'Escape') {
              setResults([]);
            }
          }}
          placeholder="Start typing an artist's name…"
          autoComplete="off"
          role="combobox"
          aria-expanded={available.length > 0}
          aria-controls="place-artist-results"
          className={fieldClassName}
        />
        {available.length > 0 && (
          <ul
            id="place-artist-results"
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-lg overflow-hidden"
          >
            {available.map((c, i) => (
              <li key={c.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => choose(c)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full text-left px-4 py-2.5 text-sm ${i === active ? 'bg-[#f6f6f3]' : ''}`}
                >
                  <span className="text-[#1a1a1a]">{c.name}</span>
                  {connectedSlugs.includes(c.slug) && (
                    <span className="ml-2 text-[0.72rem] text-[#a84573]">already listed — add another role</span>
                  )}
                  {(c.medium || c.neighborhood) && (
                    <span className="ml-2 text-[0.78rem] text-[#999] font-light">
                      {[c.medium, c.neighborhood].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searched && results.length === 0 && !picked && (
        <p className="text-[0.78rem] text-[#777] mt-2">
          No artist by that name on Art Here yet. Check the spelling, or invite them below.
        </p>
      )}

      {picked && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={relationship}
            onChange={e => setRelationship(e.target.value as PlaceRelationship)}
            className={`${fieldClassName} sm:w-auto`}
            aria-label={`How ${picked.name} is connected`}
          >
            {PLACE_RELATIONSHIP_ORDER.map(rel => (
              <option key={rel} value={rel}>
                {PLACE_GROUP_HEADINGS[rel]}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder={relationship === 'OTHER' ? 'Title, e.g. Residency alumni' : 'Title (optional), e.g. Founder'}
            maxLength={100}
            aria-label={`${picked.name}'s title`}
            className={fieldClassName}
          />
          <button
            type="button"
            onClick={add}
            disabled={adding}
            className="px-5 py-2.5 rounded-full bg-[#1a1a1a] text-white text-[0.85rem] font-medium hover:opacity-80 disabled:opacity-30 whitespace-nowrap"
          >
            {adding ? 'Adding…' : `Add ${picked.name}`}
          </button>
          <button type="button" onClick={reset} className="text-[0.8rem] text-[#999] hover:text-[#1a1a1a]">
            Cancel
          </button>
        </div>
      )}
      {error && <p className="text-[0.8rem] text-red-600 mt-2">{error}</p>}
    </div>
  );
}
