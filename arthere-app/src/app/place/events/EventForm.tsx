'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AUDIENCE_SUGGESTIONS, EVENT_DESCRIPTION_MAX } from '@/lib/events';
import { resizeImageForUpload } from '@/lib/client-image-resize';

export interface EventFormInitial {
  id?: string;
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  link: string;
  price: string;
  audience: string;
  coverImageUrl: string | null;
  artistIds: string[];
}

const field = 'w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999]';
const label = 'block text-xs font-medium text-[#555] mb-1.5';

export default function EventForm({
  initial,
  artists,
  importable = false,
}: {
  initial: EventFormInitial;
  artists: { id: string; name: string }[];
  /** New events start with a "paste your source link" step. */
  importable?: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');
  // Source-of-truth import (new events only): paste a link, we fill the form, the org approves.
  const [stage, setStage] = useState<'source' | 'review'>(importable ? 'source' : 'review');
  const [sourceUrl, setSourceUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [imported, setImported] = useState(false);
  const [coverRemote, setCoverRemote] = useState<string | null>(null);

  async function runImport(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setImportError('');
    try {
      const res = await fetch('/api/place/events/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: sourceUrl }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? 'We couldn’t read that link.');
      setV((p) => ({
        ...p,
        name: d.name ?? p.name,
        startDate: d.startDate ?? p.startDate,
        startTime: d.startTime ?? p.startTime,
        endDate: d.endDate ?? p.endDate,
        endTime: d.endTime ?? p.endTime,
        price: d.price ?? p.price,
        audience: d.audience ?? p.audience,
        description: d.description ?? p.description,
        artistIds: d.artistIds?.length ? d.artistIds : p.artistIds,
        link: d.url ?? sourceUrl,
      }));
      setCoverRemote(d.coverSourceUrl ?? null);
      setImported(true);
      setStage('review');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'We couldn’t read that link.');
    } finally {
      setImporting(false);
    }
  }

  const set = <K extends keyof EventFormInitial>(k: K, val: EventFormInitial[K]) => setV((p) => ({ ...p, [k]: val }));
  const preview = useMemo(() => (cover ? URL.createObjectURL(cover) : removeCover ? null : v.coverImageUrl ?? coverRemote), [cover, removeCover, v.coverImageUrl, coverRemote]);
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
      for (const k of ['name', 'startDate', 'startTime', 'endDate', 'endTime', 'description', 'link', 'price', 'audience'] as const) form.append(k, v[k]);
      v.artistIds.forEach((id) => form.append('artistId', id));
      if (cover) form.append('cover', await resizeImageForUpload(cover));
      else if (removeCover) form.append('removeCover', 'true');
      else if (coverRemote && !v.coverImageUrl) form.append('coverUrl', coverRemote);
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

  if (stage === 'source') {
    return (
      <form onSubmit={runImport} className="flex flex-col gap-4">
        <div>
          <label className={label} htmlFor="ev-source">Link to your event&rsquo;s &ldquo;source of truth&rdquo;</label>
          <input id="ev-source" type="text" inputMode="url" required autoFocus placeholder="https://" className={field} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          <p className="text-xs text-[#888] mt-2">
            Paste the page you already keep up to date &mdash; your event page, Eventbrite, a flyer or PDF. We&rsquo;ll pull the
            event details and photo, and it will link back there. You&rsquo;ll review everything and approve it before your event
            is listed on Art Here.
          </p>
        </div>
        {importError && <p className="text-sm text-red-600">{importError}</p>}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={importing} className="px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm font-medium hover:opacity-80 disabled:opacity-40">
            {importing ? 'Reading your link…' : 'Pull in my event'}
          </button>
          <button type="button" onClick={() => setStage('review')} className="text-sm text-[#888] underline">Enter details myself</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {imported && (
        <div className="rounded-lg bg-[#f7f6f3] border border-[#dedad4] px-4 py-3 text-sm text-[#555]">
          We filled this in from your link. Please check each field &mdash; anything we couldn&rsquo;t find is left blank &mdash; then approve it below.
        </div>
      )}
      <div>
        <label className={label} htmlFor="ev-name">Event name</label>
        <input id="ev-name" className={field} value={v.name} maxLength={120} required onChange={(e) => set('name', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="ev-sd">Starts</label>
          <div className="flex gap-2">
            <input id="ev-sd" type="date" className={field} value={v.startDate} required onChange={(e) => set('startDate', e.target.value)} />
            <input type="time" aria-label="Start time" required className={field} value={v.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="ev-ed">Ends</label>
          <div className="flex gap-2">
            <input id="ev-ed" type="date" className={field} value={v.endDate} placeholder="Same day" onChange={(e) => set('endDate', e.target.value)} />
            <input type="time" aria-label="End time" required className={field} value={v.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </div>
        </div>
        <p className="sm:col-span-2 text-xs text-[#999] -mt-2">Times are Pacific. Leave the end date blank if the event ends the same day.</p>
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
        <label className={label} htmlFor="ev-desc">Event description <span className="text-[#aaa]">(up to {EVENT_DESCRIPTION_MAX} characters)</span></label>
        <textarea id="ev-desc" rows={4} required maxLength={EVENT_DESCRIPTION_MAX} className={field} value={v.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="ev-price">Price</label>
          <input id="ev-price" className={field} required maxLength={40} placeholder="Free, $10, sliding scale…" value={v.price} onChange={(e) => set('price', e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="ev-aud">Age range / who it&rsquo;s for</label>
          <input id="ev-aud" list="ev-aud-options" className={field} required maxLength={60} placeholder="All ages, 21+, members only…" value={v.audience} onChange={(e) => set('audience', e.target.value)} />
          <datalist id="ev-aud-options">{AUDIENCE_SUGGESTIONS.map((o) => <option key={o} value={o} />)}</datalist>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="ev-link">Link to learn more</label>
        <input id="ev-link" type="text" inputMode="url" required placeholder="https://" className={field} value={v.link} onChange={(e) => set('link', e.target.value)} />
      </div>
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === 'saving'} className="px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm font-medium hover:opacity-80 disabled:opacity-40">
          {status === 'saving' ? 'Saving…' : v.id ? 'Save changes' : imported ? 'Approve & submit event' : 'Submit event'}
        </button>
        <Link href="/place/events" className="text-sm text-[#888]">Cancel</Link>
      </div>
      <p className="text-xs text-[#999]">New and edited events are reviewed by the Art Here team before they appear on the site.</p>
    </form>
  );
}
