'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArtistNamePicker } from '@/components/ArtistNamePicker';
import { resizeImageForUpload } from '@/lib/client-image-resize';

const field = 'w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999]';
const label = 'block text-xs font-medium text-[#555] mb-1.5';
const NEW_PLACE = '__new__';

export default function SubmitEventForm({ places, artistNames, eventsHref }: { places: { id: string; name: string }[]; artistNames: string[]; eventsHref: string }) {
  const [artists, setArtists] = useState<string[]>([]);
  const [placeChoice, setPlaceChoice] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const form = new FormData(e.currentTarget);
      form.delete('cover');
      form.delete('placeChoice');
      artists.forEach((a) => form.append('artist', a));
      if (placeChoice && placeChoice !== NEW_PLACE) form.set('placeId', placeChoice);
      if (cover) form.set('cover', await resizeImageForUpload(cover));
      const res = await fetch('/api/events/submit', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong. Please try again.');
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div>
        <p className="text-lg font-medium mb-2">Thanks — we got it!</p>
        <p className="text-sm text-[#666] mb-6">We&rsquo;ll review your event and be in touch if we have questions.</p>
        <Link href={eventsHref} className="text-sm underline">← Back to events</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <label className={label} htmlFor="se-name">Event name</label>
        <input id="se-name" name="name" required maxLength={120} className={field} />
      </div>

      <div>
        <label className={label} htmlFor="se-place">Where is it happening?</label>
        <select id="se-place" name="placeChoice" required value={placeChoice} onChange={(e) => setPlaceChoice(e.target.value)} className={field}>
          <option value="" disabled>Choose a place…</option>
          {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value={NEW_PLACE}>Somewhere else — not on Art Here yet</option>
        </select>
        {placeChoice === NEW_PLACE && (
          <div className="mt-3 flex flex-col gap-3 p-4 rounded-lg bg-[#f7f7f3]">
            <div>
              <label className={label} htmlFor="se-venue">Name of the place</label>
              <input id="se-venue" name="venueName" required className={field} />
            </div>
            <div>
              <label className={label} htmlFor="se-poc">Email for someone at that place</label>
              <input id="se-poc" name="pocEmail" type="email" required className={field} />
              <p className="text-xs text-[#888] mt-1.5">
                Events are shared by places that have a page on Art Here, so we&rsquo;ll invite them to join first.
                Your event will be listed once they&rsquo;re on board.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="se-sd">Starts</label>
          <div className="flex gap-2">
            <input id="se-sd" name="startDate" type="date" required className={field} />
            <input name="startTime" type="time" aria-label="Start time" className={field} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="se-ed">Ends <span className="text-[#aaa]">(optional)</span></label>
          <div className="flex gap-2">
            <input id="se-ed" name="endDate" type="date" className={field} />
            <input name="endTime" type="time" aria-label="End time" className={field} />
          </div>
        </div>
        <p className="sm:col-span-2 text-xs text-[#999] -mt-2">Leave the start time blank for an all-day event. Times are Pacific.</p>
      </div>

      <div>
        <label className={label}>Artists involved <span className="text-[#aaa]">(optional)</span></label>
        <ArtistNamePicker options={artistNames} value={artists} onChange={setArtists} className={field} />
      </div>

      <div>
        <label className={label} htmlFor="se-cover">Cover photo <span className="text-[#aaa]">(optional)</span></label>
        <input id="se-cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="se-me">Your name</label>
          <input id="se-me" name="submitterName" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="se-email">Your email</label>
          <input id="se-email" name="submitterEmail" type="email" required className={field} />
        </div>
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button type="submit" disabled={status === 'sending'} className="px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm font-medium hover:opacity-80 disabled:opacity-40">
          {status === 'sending' ? 'Sending…' : 'Submit event'}
        </button>
      </div>
    </form>
  );
}
