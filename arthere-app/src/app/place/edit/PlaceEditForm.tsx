'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FramingButton } from '@/components/FramingButton';

interface Artist {
  slug: string;
  name: string;
}

interface InitialData {
  name: string;
  neighborhood: string;
  description: string;
  website: string;
  heroImageUrl: string | null;
  thumbnailImageUrl: string | null;
  galleryImages: string[];
  artists: Artist[];
}

const LABEL = 'block text-[0.7rem] font-semibold text-[#aaa] mb-2 uppercase tracking-widest';
const BTN = 'px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-[0.88rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';
const INLINE_H1 = 'bg-transparent border-0 border-b border-[#e8e8e8] focus:border-[#aaa] focus:outline-none transition-colors placeholder-[#d0d0d0] text-[#1a1a1a] font-heading text-[1.35rem] sm:text-[1.6rem] font-bold tracking-[-0.01em] leading-tight w-full pb-1';
const INLINE_META = 'bg-transparent border-0 border-b border-[#e8e8e8] focus:border-[#aaa] focus:outline-none transition-colors placeholder-[#d0d0d0] text-[0.88rem] text-[#888] font-light w-full pb-1';
const INLINE_BODY = 'bg-transparent border border-transparent hover:border-[#e8e8e8] focus:border-[#ccc] focus:outline-none rounded-md transition-colors placeholder-[#ccc] text-[1.05rem] text-[#444] font-light leading-[1.8] w-full px-2 -mx-2 py-1 resize-none';
const FIELD = 'w-full px-4 py-3 rounded-lg border border-[#e8e8e8] text-[0.95rem] text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';

export default function PlaceEditForm({ initialData, placeSlug }: { initialData: InitialData; placeSlug: string }) {
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState(initialData.name);
  const [neighborhood, setNeighborhood] = useState(initialData.neighborhood);
  const [description, setDescription] = useState(initialData.description);
  const [website, setWebsite] = useState(initialData.website);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(initialData.heroImageUrl);
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string | null>(initialData.thumbnailImageUrl);
  const [galleryImages, setGalleryImages] = useState<string[]>(initialData.galleryImages);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function uploadFile(file: File, isHero = false) {
    const form = new FormData();
    form.append('file', file);
    if (isHero) form.append('isHero', 'true');
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return (await res.json()).url as string;
  }

  async function persistAll(overrides: Partial<{ heroImageUrl: string | null; thumbnailImageUrl: string | null; galleryImages: string[] }> = {}) {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/place/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          neighborhood,
          description,
          website,
          heroImageUrl: 'heroImageUrl' in overrides ? overrides.heroImageUrl : heroImageUrl,
          thumbnailImageUrl: 'thumbnailImageUrl' in overrides ? overrides.thumbnailImageUrl : thumbnailImageUrl,
          galleryImages: 'galleryImages' in overrides ? overrides.galleryImages : galleryImages,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }

  // Debounced autosave for text fields
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistAll(), 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, neighborhood, description, website]);

  async function handleHeroSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, true);
      setHeroImageUrl(url);
      await persistAll({ heroImageUrl: url });
    } catch { setSaveStatus('error'); }
    setUploading(false);
    e.target.value = '';
  }

  async function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of files) {
      try { newUrls.push(await uploadFile(file)); } catch { /* skip */ }
    }
    const next = [...galleryImages, ...newUrls];
    setGalleryImages(next);
    await persistAll({ galleryImages: next });
    setUploading(false);
    e.target.value = '';
  }

  async function removeGalleryImage(i: number) {
    const next = galleryImages.filter((_, idx) => idx !== i);
    setGalleryImages(next);
    await persistAll({ galleryImages: next });
  }

  async function handleDone() {
    setSaving(true);
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    await persistAll();
    setSaving(false);
    router.push(`/places/${placeSlug}`);
  }

  return (
    <div className="min-h-full bg-white text-[#1a1a1a]">

      {/* Hero */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/40 to-transparent">
          <p className="font-heading text-sm font-bold text-white/80">Build your page</p>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-white/60 text-xs">Saving…</span>}
            {saveStatus === 'saved' && <span className="text-white/60 text-xs">Saved</span>}
            {saveStatus === 'error' && <span className="text-red-300 text-xs">Error saving</span>}
            <button type="button" onClick={handleDone} disabled={saving} className={BTN}>
              {saving ? 'Saving…' : 'Done'}
            </button>
          </div>
        </div>

        <section className="relative w-full h-[38vh] min-h-[260px] overflow-hidden bg-[#f4f4f0]">
          {heroImageUrl ? (
            <label className="block w-full h-full cursor-pointer group">
              <Image src={heroImageUrl} alt="" fill sizes="100vw" className="object-cover" priority />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all opacity-0 group-hover:opacity-100">
                <span className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-full">
                  {uploading ? 'Uploading…' : 'Change hero image'}
                </span>
              </span>
              <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroSelect} className="hidden" />
            </label>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-2">
              <span className="text-[#999] text-sm">{uploading ? 'Uploading…' : '+ Add hero image'}</span>
              <span className="text-[#ccc] text-xs">This appears at the top of your page</span>
              <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroSelect} className="hidden" />
            </label>
          )}
          {heroImageUrl && (
            <div className="absolute bottom-3 right-3 z-10">
              <FramingButton imageUrl={heroImageUrl} endpoint="/api/image-focus" aspect="21 / 9" />
            </div>
          )}
        </section>
      </div>

      {/* Identity block */}
      <div className="max-w-[980px] mx-auto px-5 sm:px-10 pt-10 pb-8 border-b border-[#f0f0f0]">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Organization name"
          autoFocus
          className={INLINE_H1}
        />
        <p className="text-[0.65rem] text-[#ccc] mt-1 mb-5">Name</p>
        <input
          value={neighborhood}
          onChange={e => setNeighborhood(e.target.value)}
          placeholder="Neighborhood"
          className={INLINE_META}
        />
        <p className="text-[0.65rem] text-[#ccc] mt-1">Neighborhood</p>
      </div>

      {/* Description + website */}
      <div className="max-w-[980px] mx-auto px-5 sm:px-10 pt-7 pb-10 border-b border-[#f0f0f0]">
        <div className="max-w-[680px]">
          <div className={LABEL}>About</div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={6}
            placeholder="Tell visitors about your space, what you do, and your connection to the arts community."
            className={`${INLINE_BODY} mb-6`}
          />
          <div className={LABEL}>Website</div>
          <input
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            className={FIELD}
          />
        </div>
      </div>

      {/* Artists here (read-only) */}
      {initialData.artists.length > 0 && (
        <div className="max-w-[980px] mx-auto px-5 sm:px-10 py-8 border-b border-[#f0f0f0]">
          <div className={LABEL}>Artists here</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            {initialData.artists.map(a => (
              <span key={a.slug} className="text-[0.85rem] text-[#888] font-light">{a.name}</span>
            ))}
          </div>
          <p className="text-[0.7rem] text-[#ccc] mt-3">Managed by the Art Here team.</p>
        </div>
      )}

      {/* Gallery */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        <div className={`${LABEL} mb-4`}>Photos (up to 6)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {galleryImages.slice(0, 6).map((url, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-[#f4f4f0] group">
              <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryImage(i)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-base flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                ×
              </button>
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <FramingButton imageUrl={url} endpoint="/api/image-focus" aspect="1 / 1" />
              </div>
            </div>
          ))}
          {galleryImages.length < 6 && (
            <label className="aspect-square rounded-md border-2 border-dashed border-[#e5e5e5] flex flex-col items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors gap-1">
              <span className="text-[#ccc] text-sm">{uploading ? 'Uploading…' : '+ Add photo'}</span>
              <input type="file" accept="image/*" multiple onChange={handleGallerySelect} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Community thumbnail — which image represents this page in the directory */}
      {(heroImageUrl || galleryImages.length > 0) && (
        <div className="max-w-[1200px] mx-auto px-5 pb-10">
          <div className={`${LABEL} mb-1`}>Community thumbnail</div>
          <p className="text-[0.72rem] text-[#bbb] mb-4">The image shown on the Community directory. Defaults to your hero image.</p>
          <div className="flex flex-wrap gap-2.5">
            {[heroImageUrl, ...galleryImages].filter((u): u is string => !!u).map((url) => {
              const selected = (thumbnailImageUrl ?? heroImageUrl) === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => { setThumbnailImageUrl(url); persistAll({ thumbnailImageUrl: url }); }}
                  className={`relative w-28 aspect-video rounded-md overflow-hidden bg-[#f4f4f0] border-2 transition-colors ${selected ? 'border-[#1a1a1a]' : 'border-transparent hover:border-[#ccc]'}`}
                >
                  <Image src={url} alt="" fill sizes="112px" className="object-cover" />
                  {selected && (
                    <span className="absolute bottom-1 right-1 bg-[#1a1a1a] text-white text-[0.55rem] px-1.5 py-0.5 rounded-full">Thumbnail</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="max-w-[980px] mx-auto px-5 sm:px-10 py-8 border-t border-[#f0f0f0] flex justify-between items-center">
        <a href={`/places/${placeSlug}`} className="text-[0.88rem] text-[#aaa] hover:text-[#1a1a1a] transition-colors no-underline">
          ← View my page
        </a>
        <button type="button" onClick={handleDone} disabled={saving} className={BTN}>
          {saving ? 'Saving…' : 'Done — view my page'}
        </button>
      </div>

      <div className="pb-10 text-center">
        <p className="text-[0.78rem] text-[#ccc] font-light">
          Having trouble?{' '}
          <a href="mailto:hello@artishere.org" className="underline underline-offset-[3px] hover:text-[#888] transition-colors">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
