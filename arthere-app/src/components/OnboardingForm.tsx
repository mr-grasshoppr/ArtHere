"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FramingButton } from "@/components/FramingButton";
import { focalStyle, type Focal } from "@/lib/focal-style";
import type { FramingValue } from "@/components/FramingEditor";
import { resizeImageForUpload } from "@/lib/client-image-resize";

type InitialData = {
  name: string; medium: string; neighborhood: string; bio: string;
  quote: string;
  otherConnections: { name: string; relationship: string; relationshipLabel?: string }[];
  links: { type: string; url: string; label?: string }[];
  bioPhotoUrl: string | null; hireFor: string;
  images: { id: string; url: string; isHero: boolean }[];
  placeRelations: { placeName: string; relationship: string }[];
  isPlaceholder: boolean;
  submittedForReviewAt: string | null;
} | null;

const LINK_TYPE_OPTIONS = [
  { value: "WEBSITE", label: "Website", placeholder: "https://yoursite.com" },
  { value: "PORTFOLIO", label: "Portfolio", placeholder: "https://yourportfolio.com" },
  { value: "INSTAGRAM", label: "Instagram", placeholder: "https://instagram.com/you" },
  { value: "PATREON", label: "Patreon", placeholder: "https://patreon.com/you" },
  { value: "SHOP", label: "Shop", placeholder: "https://yourshop.com" },
  { value: "OTHER", label: "Other", placeholder: "https://…" },
];

const RELATIONSHIP_TYPES = [
  { value: "MEMBER", label: "Member" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "STUDENT", label: "Student" },
  { value: "EXHIBITING_ARTIST", label: "Exhibiting artist" },
  { value: "GRANTEE", label: "Grantee" },
  { value: "IN_SHOP", label: "In shop" },
  { value: "OTHER", label: "Other…" },
];

const MEDIUM_OPTIONS = [
  'Painting', 'Drawing', 'Photography', 'Sculpture', 'Ceramics',
  'Textiles', 'Woodworking', 'New Media', 'Illustration',
];

const OFFERING_OPTIONS = [
  { value: "sell_existing", label: "Selling existing artwork" },
  { value: "custom_artwork", label: "Custom work" },
  { value: "classes", label: "Teaching classes, lessons, or workshops" },
  { value: "consultations", label: "Consultations" },
];

// ─── Styles ───────────────────────────────────────────────────────────────

const INLINE =
  "bg-transparent border-0 border-b border-transparent focus:outline-none focus:border-[#d0d0d0] transition-colors placeholder-[#d0d0d0] text-[#1a1a1a] w-full px-0 py-0";

const FIELD =
  "w-full px-4 py-3 rounded-lg border border-[#e8e8e8] text-[0.95rem] text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white";

const LABEL = "block text-[0.7rem] font-semibold text-[#aaa] mb-2 uppercase tracking-widest";

const BTN =
  "px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-[0.88rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer";

export default function OnboardingForm({
  initialData,
  initialFocals,
}: {
  initialData: InitialData;
  /** url → stored framing, keyed by image url; absent = default centered framing. */
  initialFocals?: Record<string, Focal>;
}) {
  const [focals, setFocals] = useState<Record<string, Focal>>(initialFocals ?? {});
  const styleFor = (url?: string | null) => focalStyle(url ? focals[url] : undefined);
  function rememberFocal(url: string, value: FramingValue) {
    setFocals((prev) => ({ ...prev, [url]: value }));
  }
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const bioPhotoInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null); // kept for scroll-to on finish validation

  // Profile fields
  const [name, setName] = useState(initialData?.name ?? "");
  const [mediumValues, setMediumValues] = useState<string[]>(() => {
    if (!initialData?.medium) return [];
    const parts = initialData.medium.split(',').map(s => s.trim());
    return parts.filter(p => MEDIUM_OPTIONS.includes(p));
  });
  const [mediumOther, setMediumOther] = useState(() => {
    if (!initialData?.medium) return '';
    const parts = initialData.medium.split(',').map(s => s.trim());
    return parts.filter(p => !MEDIUM_OPTIONS.includes(p)).join(', ');
  });
  const [showMediumOther, setShowMediumOther] = useState(() => {
    if (!initialData?.medium) return false;
    const parts = initialData.medium.split(',').map(s => s.trim());
    return parts.some(p => !MEDIUM_OPTIONS.includes(p));
  });
  const [neighborhood, setNeighborhood] = useState(initialData?.neighborhood ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [quote, setQuote] = useState(initialData?.quote ?? "");

  // Places: 3 fixed rows, pre-filled from existing data. `placeId` is set only
  // when a venue is picked from the typeahead (links to that page); otherwise
  // the name is saved as plain text. Pre-filled rows re-link by exact name on
  // save, so they don't need a stored id.
  const [places, setPlaces] = useState<{ placeName: string; placeId?: string; relationship: string; relationshipLabel: string }[]>(() => {
    const existing = initialData?.placeRelations ?? [];
    const rows = existing.slice(0, 3).map((r) => ({ placeName: r.placeName, relationship: r.relationship, relationshipLabel: (r as { relationshipLabel?: string }).relationshipLabel ?? "" }));
    while (rows.length < 3) rows.push({ placeName: "", relationship: "MEMBER", relationshipLabel: "" });
    return rows;
  });

  // Other connections — same shape as Places but never linked to a page.
  const [otherConnections, setOtherConnections] = useState<{ name: string; relationship: string; relationshipLabel: string }[]>(
    () => (initialData?.otherConnections ?? []).map((c) => ({ name: c.name, relationship: c.relationship, relationshipLabel: c.relationshipLabel ?? "" }))
  );

  // Links: 3 fixed rows, each typed via dropdown. Blank rows (no url) are
  // dropped on save.
  const [links, setLinks] = useState<{ type: string; url: string; label: string }[]>(() => {
    const existing = initialData?.links ?? [];
    const rows = existing.slice(0, 3).map((l) => ({ type: l.type, url: l.url, label: l.label ?? "" }));
    while (rows.length < 3) rows.push({ type: "WEBSITE", url: "", label: "" });
    return rows;
  });

  // Offerings checkboxes — reverse-map hireFor text back to option values
  // Legacy label aliases for backward compat with previously saved data
  const LEGACY_ALIASES: Record<string, string> = {
    "sell_existing": "Sell existing artwork",
    "custom_artwork": "Make custom artwork",
    "classes": "Teach classes, lessons, or workshops",
    "consultations": "Consultations",
  };
  const [offerings, setOfferings] = useState<string[]>(() => {
    if (!initialData?.hireFor) return [];
    return OFFERING_OPTIONS.filter((o) =>
      initialData.hireFor.includes(o.label) || initialData.hireFor.includes(LEGACY_ALIASES[o.value] ?? '')
    ).map((o) => o.value);
  });
  const [offeringsOther, setOfferingsOther] = useState("");

  // Images
  const [images, setImages] = useState<{ id: string; url: string; isHero: boolean }[]>(initialData?.images ?? []);
  const [bioPhotoUrl, setBioPhotoUrl] = useState<string | null>(initialData?.bioPhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadingBio, setUploadingBio] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [hasArtist, setHasArtist] = useState(!!initialData);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [finishing, setFinishing] = useState(false);

  // Publish gating — a brand-new profile (no initialData yet) will become a
  // placeholder the moment it's first saved (see api/profile/route.ts), so
  // default to true rather than leaving this undefined pre-save.
  const [isPlaceholder] = useState(initialData?.isPlaceholder ?? true);
  const [reviewSubmittedAt, setReviewSubmittedAt] = useState<string | null>(initialData?.submittedForReviewAt ?? null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroImage = images.find((img) => img.isHero) ?? images[0] ?? null;
  const galleryImages = images.filter((img) => img.id !== heroImage?.id);

  // ─── Save ────────────────────────────────────────────────────────────

  function buildMediumText() {
    const parts = [...mediumValues];
    if (mediumOther.trim()) parts.push(mediumOther.trim());
    return parts.join(', ');
  }

  function toggleMedium(value: string) {
    setMediumValues(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  }

  function buildOfferingsText() {
    const selected = offerings.map((v) => OFFERING_OPTIONS.find((o) => o.value === v)?.label ?? v);
    if (offeringsOther.trim()) selected.push(offeringsOther.trim());
    return selected.join(", ");
  }

  async function persist() {
    if (!name.trim() && !initialData) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          quote: quote.trim() || null,
          medium: buildMediumText() || null,
          neighborhood,
          hireFor: buildOfferingsText() || null,
          placeRelations: places
            .filter((p) => p.placeName.trim())
            .map((p) => ({ placeId: p.placeId, placeName: p.placeName.trim(), relationship: p.relationship, relationshipLabel: p.relationshipLabel.trim() || null })),
          otherConnections: otherConnections
            .filter((c) => c.name.trim())
            .map((c) => ({ name: c.name.trim(), relationship: c.relationship, relationshipLabel: c.relationshipLabel.trim() || null })),
          links: links
            .filter((l) => l.url.trim())
            .map((l) => ({ type: l.type, url: l.url.trim(), label: l.label.trim() || null })),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      setHasArtist(true);
      setSaveStatus("saved");
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setSaveStatus("error");
    }
  }

  useEffect(() => {
    if (!name.trim()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 900);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, bio, quote, JSON.stringify(mediumValues), mediumOther, neighborhood, JSON.stringify(offerings), offeringsOther, JSON.stringify(places), JSON.stringify(otherConnections), JSON.stringify(links)]);

  // ─── Images ──────────────────────────────────────────────────────────

  async function uploadFile(file: File, fields: Record<string, string>) {
    const form = new FormData();
    form.append("file", await resizeImageForUpload(file));
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    return fetch("/api/upload", { method: "POST", body: form });
  }

  async function handleHeroSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const res = await uploadFile(file, { isHero: "true" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const data = await res.json();
      setImages((prev) => [
        ...prev.map((img) => ({ ...img, isHero: false })),
        { id: data.id, url: data.url, isHero: true },
      ]);
    } catch (err) { setUploadError(err instanceof Error ? err.message : "Upload failed."); }
    setUploading(false);
    e.target.value = "";
  }

  async function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadError("");
    for (const file of files) {
      try {
        const first = images.length === 0;
        const res = await uploadFile(file, { isHero: first ? "true" : "false" });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        const data = await res.json();
        setImages((prev) => {
          const base = first ? prev.map((img) => ({ ...img, isHero: false })) : prev;
          return [...base, { id: data.id, url: data.url, isHero: data.isHero }];
        });
      } catch (err) { setUploadError(err instanceof Error ? err.message : "Upload failed."); }
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleBioPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBio(true);
    try {
      const res = await uploadFile(file, { isBioPhoto: "true" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      setBioPhotoUrl((await res.json()).url);
    } catch (err) { setUploadError(err instanceof Error ? err.message : "Upload failed."); }
    setUploadingBio(false);
    e.target.value = "";
  }

  async function handleGalleryReplace(oldId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      await fetch(`/api/images?id=${oldId}`, { method: "DELETE" });
      const res = await uploadFile(file, { isHero: "false" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const data = await res.json();
      setImages((prev) => prev.map((img) => img.id === oldId ? { id: data.id, url: data.url, isHero: false } : img));
    } catch (err) { setUploadError(err instanceof Error ? err.message : "Upload failed."); }
    setUploading(false);
    e.target.value = "";
  }

  function toggleOffering(value: string) {
    setOfferings((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  }

  async function handleFinish() {
    setFinishing(true);
    await persist();
    setFinishing(false);
    router.push("/profile");
  }

  // Deliberate "I'm done, please look at this" signal — separate from
  // autosave so it isn't fired on every keystroke. Saves first so the admin
  // reviews what was actually just typed, not a stale version.
  async function handleSubmitForReview() {
    setSubmittingReview(true);
    try {
      await persist();
      const res = await fetch("/api/profile/submit-for-review", { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      setReviewSubmittedAt(new Date().toISOString());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setSaveStatus("error");
    }
    setSubmittingReview(false);
  }

  return (
    <div>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-[#f0f0f0]">
        <p className="font-heading text-sm font-bold text-[#1a1a1a]">Build your profile</p>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && <span className="text-[#999] text-xs">Saving…</span>}
          {saveStatus === "saved" && <span className="text-[#999] text-xs">Saved</span>}
          {saveStatus === "error" && <span className="text-red-500 text-xs">{errorMsg}</span>}
          {isPlaceholder && hasArtist && (
            reviewSubmittedAt ? (
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={submittingReview}
                className="text-xs px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                title="Submitted — click to notify Art Here again after further changes"
              >
                {submittingReview ? "Sending…" : "✓ Submitted for review"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={submittingReview}
                className="text-xs px-4 py-2 rounded-full border border-[#1a1a1a] text-[#1a1a1a] font-medium hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50"
              >
                {submittingReview ? "Submitting…" : "Submit for review"}
              </button>
            )
          )}
          <button type="button" onClick={handleFinish} disabled={finishing} className={BTN}>
            {finishing ? "Saving…" : "Done"}
          </button>
        </div>
      </div>

      {/* ── Hero + bio photo ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pt-8 mb-20 relative">
        {/* Hero image */}
        <div className="rounded-lg overflow-hidden bg-[#f0ede9] relative" style={{ aspectRatio: "2.5 / 1" }}>
          {heroImage ? (
            <>
              <label className="block w-full h-full cursor-pointer group absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage.url} alt="" className="w-full h-full object-cover" style={styleFor(heroImage.url)} />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-full">
                    {uploading ? "Uploading…" : "Change header image"}
                  </span>
                </span>
                <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleHeroSelect} className="hidden" />
              </label>
              <div className="absolute bottom-2 right-2 z-10">
                <FramingButton
                  imageUrl={heroImage.url}
                  endpoint="/api/image-focus"
                  aspect="2.5 / 1"
                  onSaved={(v) => rememberFocal(heroImage.url, v)}
                />
              </div>
            </>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-1 absolute inset-0">
              <span className="text-[#bbb] text-sm">{uploading ? "Uploading…" : "+ Add header image"}</span>
              <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleHeroSelect} className="hidden" />
            </label>
          )}
        </div>

        {/* Bio photo — overlaps hero bottom-left */}
        <div className="absolute -bottom-14 left-8">
          <label className="block cursor-pointer">
            {bioPhotoUrl ? (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bioPhotoUrl} alt="" className="w-full h-full object-cover hover:opacity-80 transition-opacity" style={styleFor(bioPhotoUrl)} />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#e8e3dc] border-4 border-white shadow-sm flex flex-col items-center justify-center hover:bg-[#ddd8d0] transition-colors">
                <span className="text-[#aaa] text-[12px] text-center leading-tight px-2">
                  {uploadingBio ? "…" : "+ Photo"}
                </span>
              </div>
            )}
            <input ref={bioPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBioPhotoSelect} className="hidden" />
          </label>
          {bioPhotoUrl && (
            <div className="absolute bottom-1 right-1">
              <FramingButton
                imageUrl={bioPhotoUrl}
                endpoint="/api/image-focus"
                aspect="1 / 1"
                label="Adjust"
                onSaved={(v) => rememberFocal(bioPhotoUrl, v)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Constrained content ──────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">

      {uploadError && <p className="text-red-500 text-xs mb-3">{uploadError}</p>}

      {/* ── Name + subtitle ───────────────────────────────────────────── */}
      <div className="mb-6">
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          className={`${INLINE} text-3xl font-semibold mb-2`}
        />
        <div className="flex gap-3 flex-wrap mt-2">
          <div className="flex-1 min-w-[220px]">
            <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mb-2 ml-1">Medium</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {MEDIUM_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleMedium(opt)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${mediumValues.includes(opt) ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-white text-[#555] border-[#e0e0e0] hover:border-[#999]'}`}
                >
                  {opt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowMediumOther(v => !v);
                  if (!showMediumOther) setTimeout(() => document.getElementById('medium-other')?.focus(), 50);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${showMediumOther ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-white text-[#555] border-[#e0e0e0] hover:border-[#999]'}`}
              >
                Other
              </button>
            </div>
            {showMediumOther && (
              <input
                id="medium-other"
                value={mediumOther}
                onChange={e => setMediumOther(e.target.value)}
                placeholder="Describe your medium…"
                className={`${FIELD} text-sm mt-1`}
                autoFocus
              />
            )}
          </div>
          <div className="flex-1 min-w-[160px]">
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="e.g. Multnomah Village"
              className={FIELD}
            />
            <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mt-1.5 ml-1">Neighborhood (primary)</p>
          </div>
        </div>
      </div>

      {/* ── Pull quote ───────────────────────────────────────────────── */}
      <textarea
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        rows={2}
        placeholder="Optional — a short quote shown above your bio"
        className={`${FIELD} leading-relaxed resize-none mb-4`}
      />

      {/* ── Bio ───────────────────────────────────────────────────────── */}
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={5}
        placeholder="Tell visitors about yourself and your work, your background, what you make, and what inspires you."
        className={`${FIELD} leading-relaxed resize-none mb-2`}
      />
      <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mb-4 ml-1">Your bio</p>

      {/* ── Links ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mb-2 ml-1">Links</p>
        <div className="space-y-2">
          {links.map((link, i) => {
            const meta = LINK_TYPE_OPTIONS.find((t) => t.value === link.type) ?? LINK_TYPE_OPTIONS[0];
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <select
                    value={link.type}
                    onChange={(e) => setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, type: e.target.value } : l))}
                    className="px-3 py-3 rounded-lg border border-[#e8e8e8] text-sm text-[#555] bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    {LINK_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    value={link.url}
                    onChange={(e) => setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))}
                    placeholder={meta.placeholder}
                    className={`${FIELD} flex-1`}
                  />
                </div>
                {link.type === "OTHER" && (
                  <input
                    value={link.label}
                    onChange={(e) => setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, label: e.target.value } : l))}
                    placeholder="Label, e.g. Etsy shop"
                    className={`${FIELD} text-sm`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Places ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-[0.7rem] font-semibold text-[#aaa] uppercase tracking-widest mb-1">Community Connections</h2>
        <p className="text-[0.78rem] text-[#999] mb-3">
          The local places, organizations, galleries, and businesses you&apos;re connected to.
        </p>
        <div className="space-y-2">
          {places.map((rel, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <VenueNameField
                  value={rel.placeName}
                  onChangeText={(text) =>
                    setPlaces((prev) => prev.map((p, idx) => idx === i ? { ...p, placeName: text, placeId: undefined } : p))
                  }
                  onPick={(place) =>
                    setPlaces((prev) => prev.map((p, idx) => idx === i ? { ...p, placeName: place.name, placeId: place.id } : p))
                  }
                  linked={!!rel.placeId}
                  fieldClass={`${FIELD} flex-1`}
                />
                <select
                  value={rel.relationship}
                  onChange={(e) => setPlaces((prev) => prev.map((p, idx) => idx === i ? { ...p, relationship: e.target.value, relationshipLabel: "" } : p))}
                  className="px-3 py-3 rounded-lg border border-[#e8e8e8] text-sm text-[#555] bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors cursor-pointer"
                >
                  {RELATIONSHIP_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
                {places.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPlaces((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-[#ccc] hover:text-[#999] text-lg leading-none flex-shrink-0 px-1"
                    title="Remove"
                  >×</button>
                )}
              </div>
              {rel.relationship === "OTHER" && (
                <input
                  value={rel.relationshipLabel}
                  onChange={(e) => setPlaces((prev) => prev.map((p, idx) => idx === i ? { ...p, relationshipLabel: e.target.value } : p))}
                  placeholder="Describe your connection…"
                  className={`${FIELD} text-sm ml-0`}
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPlaces((prev) => [...prev, { placeName: "", relationship: "MEMBER", relationshipLabel: "" }])}
          className="mt-3 text-[0.82rem] text-[#999] hover:text-[#1a1a1a] transition-colors"
        >
          + Add another place
        </button>
      </div>

      {/* ── Other connections ────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-[0.7rem] font-semibold text-[#aaa] uppercase tracking-widest mb-1">Other Connections</h2>
        <p className="text-[0.78rem] text-[#999] mb-3">
          International, national, or other affiliations outside of your local area.
        </p>
        <div className="space-y-2">
          {otherConnections.map((conn, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <input
                  value={conn.name}
                  onChange={(e) => setOtherConnections((prev) => prev.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
                  placeholder="e.g. Oregon Watercolor Society"
                  className={`${FIELD} flex-1`}
                />
                <select
                  value={conn.relationship}
                  onChange={(e) => setOtherConnections((prev) => prev.map((c, idx) => idx === i ? { ...c, relationship: e.target.value, relationshipLabel: "" } : c))}
                  className="px-3 py-3 rounded-lg border border-[#e8e8e8] text-sm text-[#555] bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors cursor-pointer"
                >
                  {RELATIONSHIP_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setOtherConnections((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[#ccc] hover:text-[#999] text-lg leading-none flex-shrink-0 px-1"
                  title="Remove"
                >×</button>
              </div>
              {conn.relationship === "OTHER" && (
                <input
                  value={conn.relationshipLabel}
                  onChange={(e) => setOtherConnections((prev) => prev.map((c, idx) => idx === i ? { ...c, relationshipLabel: e.target.value } : c))}
                  placeholder="Describe your connection…"
                  className={`${FIELD} text-sm ml-0`}
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOtherConnections((prev) => [...prev, { name: "", relationship: "MEMBER", relationshipLabel: "" }])}
          className="mt-3 text-[0.82rem] text-[#999] hover:text-[#1a1a1a] transition-colors"
        >
          + Add another connection
        </button>
      </div>

      {/* ── Work gallery (max 3) ──────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-[0.7rem] font-semibold text-[#aaa] uppercase tracking-widest">My Gallery</h2>
          <span className="text-[0.7rem] text-[#bbb]">up to 3 photos</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((slot) => {
            const img = galleryImages[slot];
            return img ? (
              <div key={img.id} className="rounded-lg overflow-hidden bg-[#f0ede9] aspect-square relative group">
                <label className="absolute inset-0 cursor-pointer block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" style={styleFor(img.url)} />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-full">
                      {uploading ? "Uploading…" : "Change photo"}
                    </span>
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleGalleryReplace(img.id, e)} className="hidden" />
                </label>
                <div className="absolute bottom-1.5 right-1.5 z-10">
                  <FramingButton
                    imageUrl={img.url}
                    endpoint="/api/image-focus"
                    aspect="1 / 1"
                    onSaved={(v) => rememberFocal(img.url, v)}
                  />
                </div>
              </div>
            ) : (
              <label
                key={slot}
                className="rounded-lg border-2 border-dashed border-[#e5e5e5] aspect-square flex items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors"
              >
                <span className="text-[#ccc] text-sm text-center px-2">
                  {uploading && slot === galleryImages.length ? "Uploading…" : "+ Add photo"}
                </span>
                <input ref={slot === galleryImages.length ? galleryInputRef : undefined} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleGallerySelect} className="hidden" />
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Additional details ────────────────────────────────────────── */}
      <div className="border-t border-[#f0f0f0] pt-8 mb-10">
        <h2 className="font-heading text-base font-bold text-[#1a1a1a] mb-6">Additional details</h2>

        <fieldset className="mb-4">
          <legend className={LABEL}>What do you currently offer?</legend>
          <div className="space-y-2.5">
            {OFFERING_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors pointer-events-none ${offerings.includes(opt.value) ? "bg-[#1a1a1a] border-[#1a1a1a]" : "border-[#ddd] group-hover:border-[#999]"}`}>
                  {offerings.includes(opt.value) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={offerings.includes(opt.value)} onChange={() => toggleOffering(opt.value)} className="sr-only" />
                <span className="text-sm text-[#333]">{opt.label}</span>
              </label>
            ))}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center mt-0.5 transition-colors pointer-events-none ${offeringsOther.trim() ? "bg-[#1a1a1a] border-[#1a1a1a]" : "border-[#ddd] group-hover:border-[#999]"}`}
              >
                {offeringsOther.trim() && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <span className="text-sm text-[#333]">Other</span>
                <input
                  id="offerings-other"
                  type="text"
                  value={offeringsOther}
                  onChange={(e) => setOfferingsOther(e.target.value)}
                  placeholder="Describe what you offer…"
                  className="block mt-1 w-full text-sm text-[#555] bg-transparent border-0 border-b border-[#e8e8e8] focus:outline-none focus:border-[#999] placeholder-[#ccc] transition-colors"
                />
              </div>
            </label>
          </div>
        </fieldset>
      </div>

      <div className="flex justify-end pb-16">
        <button type="button" onClick={handleFinish} disabled={finishing} className={BTN}>
          {finishing ? "Saving…" : "Done — view my profile"}
        </button>
      </div>

      </div>{/* end constrained content */}
    </div>
  );
}

type VenueSuggestion = { id: string; name: string; slug: string };

// Venue name input with a "did you mean…" typeahead. As the artist types, it
// searches existing venue PAGES; picking one links to that page (sets placeId),
// while free-typed names that match nothing are saved as plain text. This is
// what keeps near-duplicate venues from being created.
function VenueNameField({
  value,
  onChangeText,
  onPick,
  linked,
  fieldClass,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onPick: (place: VenueSuggestion) => void;
  linked: boolean;
  fieldClass: string;
}) {
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (linked || q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.places ?? []);
      } catch {
        /* ignore — typeahead is best-effort */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [value, linked]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Only prompt when there's no exact match — an exact typed name links by name
  // on save, so there's nothing to disambiguate.
  const exact = suggestions.some((s) => s.name.toLowerCase() === value.trim().toLowerCase());
  const showList = open && !linked && suggestions.length > 0 && !exact;

  return (
    <div ref={boxRef} className="relative flex-1">
      <input
        value={value}
        onChange={(e) => {
          onChangeText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Multnomah Arts Center"
        className={fieldClass}
        autoComplete="off"
      />
      {linked && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] text-green-600 pointer-events-none">
          ✓ linked
        </span>
      )}
      {showList && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-lg shadow-lg overflow-hidden">
          <div className="px-3 py-1.5 text-[0.68rem] text-[#aaa] uppercase tracking-wide border-b border-[#f0f0f0]">
            Did you mean…
          </div>
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onPick(s);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-[#1a1a1a] hover:bg-[#f7f6f3] transition-colors"
            >
              {s.name}
            </button>
          ))}
          <div className="px-3 py-1.5 text-[0.72rem] text-[#bbb] border-t border-[#f0f0f0]">
            Not listed? Keep typing — it&rsquo;ll be saved as text.
          </div>
        </div>
      )}
    </div>
  );
}
