'use client';

import { useState, useSyncExternalStore } from 'react';
import { NOTRACK_KEY } from '@/lib/analytics-client';

const CHANGED = 'arthere-notrack-change';

function read(): boolean {
  try {
    return window.localStorage.getItem(NOTRACK_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function NoTrackToggle() {
  // null on the server and during hydration, so the first paint matches.
  const on = useSyncExternalStore<boolean | null>(subscribe, read, () => null);
  const [failed, setFailed] = useState(false);

  function toggle() {
    try {
      if (read()) window.localStorage.removeItem(NOTRACK_KEY);
      else window.localStorage.setItem(NOTRACK_KEY, '1');
      window.dispatchEvent(new Event(CHANGED));
    } catch {
      setFailed(true);
    }
  }

  return (
    <div>
      <p className="mb-4 text-[0.95rem]" aria-live="polite">
        {on === null ? ' ' : on ? 'This browser is not being counted.' : 'This browser is being counted.'}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={on === null}
        className="px-4 py-2 rounded-full border border-[#1a1a1a] text-[0.9rem] hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-40"
      >
        {on ? 'Count my visits again' : 'Stop counting my visits'}
      </button>
      {failed && (
        <p className="mt-4 text-[0.85rem] text-[#b00]">
          This browser blocks site storage (private mode?), so the setting can&rsquo;t be saved.
        </p>
      )}
    </div>
  );
}
