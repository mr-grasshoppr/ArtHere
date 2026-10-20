'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resizeImageForUpload } from '@/lib/client-image-resize';

export interface EventFormInitial {
  id?: string;
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  coverImageUrl: string | null;
  artistIds: string[];
}

const field = 'w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999]';
const label = 'block text-xs font-medium text-[#555] mb-1.5';

export default function EventForm({
  initial,
  artists,
}: {
  initial: EventFormInitial;
  artists: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = <K extends keyof EventFormInitial>(k: K, val: EventFormInitial[K]) => setV((p) => ({ ...p, [k]: val }));
  const preview = useMemo(() => (cover ? URL.createObjectURL(cover) : removeCover ? null : v.coverImageUrl), [cover, removeCover, v.coverImageUrl]);
  const byId = useMemo(() => new Map(artists.map((a) => [a.id, a.name])), [artists]);
  const matches = filter.trim()
    ? artists.filter((a) => !v.artistIds.includes(a.id) && a.name.toLowerCase().includes(filter.trim().toLowerCase())).slice(0, 8)
    : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError('');
    try {
      const form = new FormData();
      for (const k of ['name', 'startDate', 'startTime', 'endDate', 'endTime', 'description'] as const) form.append(k, v[k]);
      v.artistIds.forEach((id) => form.append('artistId', id));
      if (cover) form.append('cover', await resizeImageForUpload(cover));
      else if (removeCover) form.append('removeCover', 'true');
      const res = await fetch(v.id ? `/api/place/events/${v.id}` : '/api/place/events', { method: v.id ? 'PUT' : 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong. Please try again.');
      router.push('/place/events?saved=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <label className={label} htmlFor="ev-name">Event name</label>
        <input id="ev-name" className={field} value={v.name} maxLength={120} required onChange={(e) => set('name', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="ev-sd">Starts</label>
          <div className="flex gap-2">
            <input id="ev-sd" type="date" className={field} value={v.startDate} required onChange={(e) => set('startDate', e.target.value)} />
            <input type="time" aria-label="Start time" className={field} value={v.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="ev-ed">Ends <span className="text-[#aaa]">(optional)</span></label>
          <div className="flex gap-2">
            <input id="ev-ed" type="date" className={field} value={v.endDate} onChange={(e) => set('endDate', e.target.value)} />
            <input type="time" aria-label="End time" className={field} value={v.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </div>
        </div>
        <p className="sm:col-span-2 text-xs text-[#999] -mt-2">Leave the start time blank for an all-day event. Times are Pacific.</p>
      </div>

      <div>
        <label className={label}>Artists involved</label>
        {v.artistIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {v.artistIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => set('artistIds', v.artistIds.filter((x) => x !== id))}
                className="px-3 py-1 rounded-full bg-[#f4f4f0] text-xs hover:bg-[#ebebe5]"
                aria-label={`Remove ${byId.get(id) ?? 'artist'}`}
              >
                {byId.get(id) ?? 'Artist'} ×
              </button>
            ))}
          </div>
        )}
        <input className={field} placeholder="Search artists on Art Here…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        {matches.length > 0 && (
          <ul className="border border-[#e5e5e5] rounded-lg mt-1 divide-y divide-[#f0f0f0]">
            {matches.map((a) => (
              <li key={a.id}>
                <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-[#fafafa]" onClick={() => { set('artistIds', [...v.artistIds, a.id]); setFilter(''); }}>
                  {a.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className={label}>Cover photo</label>
        {preview && (
          <div className="relative w-full aspect-[16/9] mb-2 rounded-lg overflow-hidden bg-[#f4f4f0]">
            <Image src={preview} alt="" fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 720px" />
          </div>
        )}
        <div className="flex items-center gap-4">
          <input type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" onChange={(e) => { setCover(e.target.files?.[0] ?? null); setRemoveCover(false); }} />
          {preview && (
            <button type="button" className="text-xs text-[#888] underline" onClick={() => { setCover(null); setRemoveCover(true); }}>Remove</button>
          )}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="ev-desc">A few words about it <span className="text-[#aaa]">(optional)</span></label>
        <textarea id="ev-desc" rows={4} maxLength={1000} className={field} value={v.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === 'saving'} className="px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm font-medium hover:opacity-80 disabled:opacity-40">
          {status === 'saving' ? 'Saving…' : v.id ? 'Save changes' : 'Submit event'}
        </button>
        <Link href="/place/events" className="text-sm text-[#888]">Cancel</Link>
      </div>
      <p className="text-xs text-[#999]">New and edited events are reviewed by the Art Here team before they appear on the site.</p>
    </form>
  );
}
