'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FramingButton } from '@/components/FramingButton';
import { PhotoGrid } from '@/components/PhotoGrid';
import { NeighborhoodPicker } from '@/components/NeighborhoodPicker';
import { focalStyle, type Focal } from '@/lib/focal-style';
import { parseNeighborhoodList, joinNeighborhoodList } from '@/lib/neighborhoods';
import type { FramingValue } from '@/components/FramingEditor';
import { resizeImageForUpload } from '@/lib/client-image-resize';
import type { PlaceRelationship } from '@prisma/client';
import { RELATIONSHIP_LABELS } from '@/lib/artist-options';

interface Artist {
  connectionId: string;
  slug: string;
  name: string;
  relationship: PlaceRelationship;
  relationshipLabel: string | null;
}

interface InitialData {
  name: string;
  neighborhood: string;
  description: string;
  quote: string;
  quoteAttribution: string;
  website: string;
  heroImageUrl: string | null;
  thumbnailImageUrl: string | null;
  galleryImages: string[];
  artists: Artist[];
  inDirectory: boolean;
  submittedForReviewAt: string | null;
}

type InitialFocals = Record<string, Focal>;

const GALLERY_MAX = 3;

const LABEL = 'block text-[0.7rem] font-semibold text-[#aaa] mb-2 uppercase tracking-widest';
const BTN = 'px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-[0.88rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';
const INLINE_H1 = 'bg-transparent border-0 border-b border-[#e8e8e8] focus:border-[#aaa] focus:outline-none transition-colors placeholder-[#d0d0d0] text-[#1a1a1a] font-heading text-[1.35rem] sm:text-[1.6rem] font-bold tracking-[-0.01em] leading-tight w-full pb-1';
const INLINE_BODY = 'bg-transparent border border-transparent hover:border-[#e8e8e8] focus:border-[#ccc] focus:outline-none rounded-md transition-colors placeholder-[#ccc] text-[1.05rem] text-[#444] font-light leading-[1.8] w-full px-2 -mx-2 py-1 resize-none';
const FIELD = 'w-full px-4 py-3 rounded-lg border border-[#e8e8e8] text-[0.95rem] text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';

export default function PlaceEditForm({
  initialData,
  placeSlug,
  neighborhoodOptions,
  initialFocals,
}: {
  initialData: InitialData;
  placeSlug: string;
  neighborhoodOptions: string[];
  initialFocals?: InitialFocals;
}) {
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focals, setFocals] = useState<InitialFocals>(initialFocals ?? {});
  const styleFor = (url?: string | null) => focalStyle(url ? focals[url] : undefined);
  const focalStyles = new Map(Object.entries(focals).map(([url, f]) => [url, focalStyle(f)]));
  function rememberFocal(url: string, value: FramingValue) {
    setFocals((prev) => ({ ...prev, [url]: value }));
  }

  const [name, setName] = useState(initialData.name);
  const [neighborhoods, setNeighborhoods] = useState<string[]>(parseNeighborhoodList(initialData.neighborhood));
  const [description, setDescription] = useState(initialData.description);
  const [quote, setQuote] = useState(initialData.quote);
  const [quoteAttribution, setQuoteAttribution] = useState(initialData.quoteAttribution);
  const [website, setWebsite] = useState(initialData.website);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(initialData.heroImageUrl);
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string | null>(initialData.thumbnailImageUrl);
  const [galleryImages, setGalleryImages] = useState<string[]>(initialData.galleryImages);
  const [artists, setArtists] = useState<Artist[]>(initialData.artists);
  const [removingConnectionId, setRemovingConnectionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [reviewSubmittedAt, setReviewSubmittedAt] = useState<string | null>(initialData.submittedForReviewAt);
  const [submittingReview, setSubmittingReview] = useState(false);

  async function uploadFile(file: File, isHero = false) {
    const form = new FormData();
    form.append('file', await resizeImageForUpload(file));
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
          neighborhood: joinNeighborhoodList(neighborhoods) ?? '',
          description,
          quote,
          quoteAttribution,
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
  }, [name, neighborhoods, description, quote, quoteAttribution, website]);

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

  async function handleThumbnailSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setThumbnailImageUrl(url);
      await persistAll({ thumbnailImageUrl: url });
    } catch { setSaveStatus('error'); }
    setUploading(false);
    e.target.value = '';
  }

  async function handleGalleryAdd(files: File[]) {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of files.slice(0, GALLERY_MAX - galleryImages.length)) {
      try { newUrls.push(await uploadFile(file)); } catch { /* skip */ }
    }
    const next = [...galleryImages, ...newUrls];
    setGalleryImages(next);
    await persistAll({ galleryImages: next });
    setUploading(false);
  }

  async function handleGalleryRemove(url: string) {
    const next = galleryImages.filter((u) => u !== url);
    setGalleryImages(next);
    await persistAll({ galleryImages: next });
  }

  async function handleGalleryReorder(next: string[]) {
    setGalleryImages(next);
    await persistAll({ galleryImages: next });
  }

  async function handleRemoveArtistConnection(connectionId: string) {
    if (!confirm("Remove this artist's connection to your page? They'll no longer be listed here or on your public page.")) return;
    setRemovingConnectionId(connectionId);
    try {
      const res = await fetch(`/api/place/artist-connections?id=${connectionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setArtists((prev) => prev.filter((a) => a.connectionId !== connectionId));
    } catch {
      alert("Couldn't remove that connection — please try again.");
    }
    setRemovingConnectionId(null);
  }

  async function handleDone() {
    setSaving(true);
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    await persistAll();
    setSaving(false);
    router.push(`/places/${placeSlug}`);
  }

  // Deliberate "I'm done, please look at this" signal — separate from
  // autosave so it isn't fired on every keystroke. Mirrors OnboardingForm's
  // handleSubmitForReview exactly.
  async function handleSubmitForReview() {
    setSubmittingReview(true);
    try {
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      await persistAll();
      const res = await fetch('/api/place/submit-for-review', { method: 'POST' });
      if (!res.ok) throw new Error();
      setReviewSubmittedAt(new Date().toISOString());
    } catch {
      setSaveStatus('error');
    }
    setSubmittingReview(false);
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">

      {/* Hero */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/40 to-transparent">
          <p className="font-heading text-sm font-bold text-white/80">Build your page</p>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-white/60 text-xs">Saving…</span>}
            {saveStatus === 'error' && <span className="text-red-300 text-xs">Error saving</span>}
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                initialData.inDirectory
                  ? 'bg-[#00ae7a]/20 text-[#6fe3bd]'
                  : reviewSubmittedAt
                  ? 'bg-[#f062a4]/20 text-[#ff9dc7]'
                  : 'bg-white/15 text-white/70'
              }`}
            >
              {initialData.inDirectory ? 'Live' : reviewSubmittedAt ? 'Pending' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Fixed 21:9 aspect (not viewport-relative height) so the crop framed
            below actually matches what renders on the live page. */}
        <section className="relative w-full aspect-[21/9] max-h-[420px] min-h-[200px] overflow-hidden bg-[#f4f4f0]">
          {heroImageUrl ? (
            <label className="block w-full h-full cursor-pointer group">
              <Image src={heroImageUrl} alt="" fill sizes="100vw" className="object-cover" style={styleFor(heroImageUrl)} priority />
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
              <FramingButton
                imageUrl={heroImageUrl}
                endpoint="/api/image-focus"
                aspect="21 / 9"
                onSaved={(v) => rememberFocal(heroImageUrl, v)}
              />
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
        <div className="max-w-[320px]">
          <NeighborhoodPicker options={neighborhoodOptions} value={neighborhoods} onChange={setNeighborhoods} />
        </div>
        <p className="text-[0.65rem] text-[#ccc] mt-1 mb-5">Neighborhoods</p>
      </div>

      {/* Description + quote + website */}
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
          <div className={LABEL}>Quote (optional)</div>
          <textarea
            value={quote}
            onChange={e => setQuote(e.target.value)}
            rows={2}
            placeholder="Alone we can do so little; together we can do so much."
            className={`${INLINE_BODY} mb-2`}
          />
          <input
            value={quoteAttribution}
            onChange={e => setQuoteAttribution(e.target.value)}
            placeholder="Attribution, e.g. Helen Keller"
            className={`${FIELD} mb-6`}
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

      {/* Artists here */}
      {artists.length > 0 && (
        <div className="max-w-[980px] mx-auto px-5 sm:px-10 py-8 border-b border-[#f0f0f0]">
          <div className={LABEL}>Artists here</div>
          <div className="flex flex-col gap-2">
            {artists.map(a => {
              const label = a.relationship === 'OTHER' ? a.relationshipLabel : RELATIONSHIP_LABELS[a.relationship];
              return (
                <div key={a.connectionId} className="flex items-baseline gap-2">
                  <span className="text-[0.85rem] text-[#444]">{a.name}</span>
                  {label && <span className="text-[0.78rem] text-[#aaa] font-light">{label}</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveArtistConnection(a.connectionId)}
                    disabled={removingConnectionId === a.connectionId}
                    className="ml-auto text-[0.75rem] text-[#bbb] hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    {removingConnectionId === a.connectionId ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[0.7rem] text-[#ccc] mt-3">
            Artists add these connections themselves. If one doesn&rsquo;t belong, remove it — this can&rsquo;t be undone from here.
          </p>
        </div>
      )}

      {/* Gallery */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        <div className={`${LABEL} mb-1`}>Photos ({galleryImages.length}/{GALLERY_MAX})</div>
        <p className="text-[0.72rem] text-[#bbb] mb-4">Tap a photo to adjust its framing, or drag to reorder.</p>
        <PhotoGrid
          images={galleryImages}
          max={GALLERY_MAX}
          framingEndpoint="/api/image-focus"
          framingAspect="1 / 1"
          focals={focalStyles}
          onReorder={handleGalleryReorder}
          onRemove={handleGalleryRemove}
          onAddFiles={handleGalleryAdd}
          uploading={uploading}
        />
      </div>

      {/* Community thumbnail — a separate image, doesn't count against the gallery */}
      <div className="max-w-[1200px] mx-auto px-5 pb-10">
        <div className={`${LABEL} mb-1`}>Community thumbnail</div>
        <p className="text-[0.72rem] text-[#bbb] mb-4">The image shown on the Community directory. Defaults to your hero image if none is chosen. Doesn&rsquo;t count against the gallery above.</p>
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
                <Image src={url} alt="" fill sizes="112px" className="object-cover" style={styleFor(url)} />
                {selected && (
                  <span className="absolute bottom-1 right-1 bg-[#1a1a1a] text-white text-[0.55rem] px-1.5 py-0.5 rounded-full">Thumbnail</span>
                )}
              </button>
            );
          })}
          <label className="w-28 aspect-video rounded-md border-2 border-dashed border-[#e5e5e5] flex flex-col items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors gap-0.5 text-center px-1">
            <span className="text-[#ccc] text-xs">{uploading ? 'Uploading…' : '+ Upload thumbnail'}</span>
            <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} className="hidden" />
          </label>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="max-w-[980px] mx-auto px-5 sm:px-10 py-8 border-t border-[#f0f0f0]">
        <div className="flex justify-between items-center">
          <a href={`/places/${placeSlug}?preview=1`} className="text-[0.88rem] text-[#aaa] hover:text-[#1a1a1a] transition-colors no-underline">
            ← View my page
          </a>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleDone}
              disabled={saving}
              className="text-sm text-[#888] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {!initialData.inDirectory && (
              reviewSubmittedAt ? (
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={submittingReview}
                  className="text-sm px-5 py-2.5 rounded-full border border-[#00ae7a]/40 bg-[#00ae7a]/10 text-[#00805a] hover:bg-[#00ae7a]/20 transition-colors disabled:opacity-50"
                  title="Submitted — click to notify Art Here again after further changes"
                >
                  {submittingReview ? 'Sending…' : '✓ Submitted'}
                </button>
              ) : (
                <button type="button" onClick={handleSubmitForReview} disabled={submittingReview} className={BTN}>
                  {submittingReview ? 'Submitting…' : 'Submit'}
                </button>
              )
            )}
          </div>
        </div>
        {!initialData.inDirectory && (
          <p className={`text-sm text-right mt-3 ${reviewSubmittedAt ? 'text-[#00805a]' : 'text-[#888]'}`}>
            {reviewSubmittedAt
              ? '✓ Submitted! Your page will go live soon!'
              : "Submit when you're ready to go live."}
          </p>
        )}
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
