'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface InitialData {
  name: string;
  neighborhood: string;
  description: string;
  website: string;
  heroImageUrl: string | null;
  galleryImages: string[];
}

const FIELD = 'w-full px-4 py-3 rounded-lg border border-[#e8e8e8] text-[0.95rem] text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';
const LABEL = 'block text-[0.7rem] font-semibold text-[#aaa] mb-2 uppercase tracking-widest';
const BTN = 'px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-[0.88rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export default function PlaceEditForm({ initialData, placeSlug }: { initialData: InitialData; placeSlug: string }) {
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData.name);
  const [neighborhood, setNeighborhood] = useState(initialData.neighborhood);
  const [description, setDescription] = useState(initialData.description);
  const [website, setWebsite] = useState(initialData.website);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(initialData.heroImageUrl);
  const [galleryImages, setGalleryImages] = useState<string[]>(initialData.galleryImages);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  async function uploadFile(file: File, isHero = false) {
    const form = new FormData();
    form.append('file', file);
    if (isHero) form.append('isHero', 'true');
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return (await res.json()).url as string;
  }

  async function handleHeroSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, true);
      setHeroImageUrl(url);
    } catch { /* ignore */ }
    setUploading(false);
    e.target.value = '';
  }

  async function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      try { urls.push(await uploadFile(file)); } catch { /* ignore */ }
    }
    setGalleryImages(prev => [...prev, ...urls]);
    setUploading(false);
    e.target.value = '';
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/place/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, neighborhood, description, website, heroImageUrl, galleryImages }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
    setSaving(false);
  }

  async function handleDone() {
    await save();
    router.push(`/places/${placeSlug}`);
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-16">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/30 to-transparent">
          <p className="font-heading text-sm font-bold text-white/80">Edit your page</p>
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && <span className="text-white/60 text-xs">Saved</span>}
            {saveStatus === 'error' && <span className="text-red-300 text-xs">Error saving</span>}
            <button type="button" onClick={handleDone} disabled={saving} className={BTN}>
              {saving ? 'Saving…' : 'Done'}
            </button>
          </div>
        </div>

        <div className="w-full bg-[#f0ede9] overflow-hidden" style={{ aspectRatio: '3 / 1' }}>
          {heroImageUrl ? (
            <label className="block w-full h-full cursor-pointer group relative">
              <Image src={heroImageUrl} alt="" fill className="object-cover" sizes="100vw" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all opacity-0 group-hover:opacity-100">
                <span className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-full">
                  {uploading ? 'Uploading…' : 'Change header image'}
                </span>
              </span>
              <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroSelect} className="hidden" />
            </label>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-1">
              <span className="text-[#bbb] text-sm">{uploading ? 'Uploading…' : '+ Add header image'}</span>
              <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroSelect} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <div className="max-w-[980px] mx-auto px-4 sm:px-10 pb-10 flex flex-col gap-8">
        <div>
          <label className={LABEL}>Place name</label>
          <input value={name} onChange={e => setName(e.target.value)} className={FIELD} placeholder="Your organization or venue name" />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className={LABEL}>Neighborhood</label>
            <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={FIELD} placeholder="e.g. Multnomah Village" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className={LABEL}>Website</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} className={FIELD} placeholder="https://yoursite.com" />
          </div>
        </div>

        <div>
          <label className={LABEL}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            className={`${FIELD} resize-none`}
            placeholder="Tell visitors about your space, what you do, and your connection to the arts community."
          />
        </div>

        {/* Gallery */}
        <div>
          <label className={LABEL}>Photos (up to 6)</label>
          <div className="grid grid-cols-3 gap-3">
            {galleryImages.slice(0, 6).map((url, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden bg-[#f0ede9] aspect-square group">
                <Image src={url} alt="" fill className="object-cover" sizes="33vw" />
                <button
                  type="button"
                  onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            {galleryImages.length < 6 && (
              <label className="rounded-lg border-2 border-dashed border-[#e5e5e5] aspect-square flex items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors">
                <span className="text-[#ccc] text-sm text-center px-2">
                  {uploading ? 'Uploading…' : '+ Add photo'}
                </span>
                <input type="file" accept="image/*" multiple onChange={handleGallerySelect} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[#f0f0f0]">
          <Link href={`/places/${placeSlug}`} className="text-[0.88rem] text-[#aaa] hover:text-[#1a1a1a] transition-colors no-underline">
            ← View my page
          </Link>
          <button type="button" onClick={handleDone} disabled={saving} className={BTN}>
            {saving ? 'Saving…' : 'Done — view my page'}
          </button>
        </div>
      </div>
    </div>
  );
}
