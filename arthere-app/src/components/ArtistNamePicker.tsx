'use client';

import { useState } from 'react';

/**
 * Type-ahead for crediting artists by full name. Suggests artists already on
 * Art Here; Enter or comma adds whatever was typed, so artists who aren't on
 * the site yet can still be named.
 */
export function ArtistNamePicker({
  options,
  value,
  onChange,
  className,
}: {
  options: string[];
  value: string[];
  onChange: (names: string[]) => void;
  className?: string;
}) {
  const [text, setText] = useState('');
  const q = text.trim().toLowerCase();
  const taken = new Set(value.map((v) => v.toLowerCase()));
  const matches = q ? options.filter((n) => !taken.has(n.toLowerCase()) && n.toLowerCase().includes(q)).slice(0, 6) : [];

  const add = (name: string) => {
    const clean = name.trim();
    if (clean && !taken.has(clean.toLowerCase())) onChange([...value, clean]);
    setText('');
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value.filter((v) => v !== n))}
              className="px-3 py-1 rounded-full bg-[#f4f4f0] text-xs hover:bg-[#ebebe5]"
              aria-label={`Remove ${n}`}
            >
              {n} ×
            </button>
          ))}
        </div>
      )}
      <input
        className={className}
        value={text}
        placeholder="Type artists’ full names"
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(matches.length === 1 && matches[0].toLowerCase().startsWith(q) ? matches[0] : text);
          }
        }}
        onBlur={() => { if (text.trim() && !matches.length) add(text); }}
      />
      {matches.length > 0 && (
        <ul className="border border-[#e5e5e5] rounded-lg mt-1 divide-y divide-[#f0f0f0] bg-white">
          {matches.map((n) => (
            <li key={n}>
              <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-[#fafafa]" onMouseDown={(e) => e.preventDefault()} onClick={() => add(n)}>
                {n}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-[#999] mt-1.5">Pick from artists on Art Here, or press Enter to add a name that isn&rsquo;t listed yet.</p>
    </div>
  );
}
