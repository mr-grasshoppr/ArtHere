"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Place = { id: string; name: string; neighborhood: string | null };

type InitialData = {
  name: string; medium: string; neighborhood: string; bio: string;
  website: string; instagram: string; bioPhotoUrl: string | null; hireFor: string;
  images: { id: string; url: string; isHero: boolean }[];
  placeRelations: { placeName: string; relationship: string }[];
} | null;

const RELATIONSHIP_TYPES = [
  { value: "MEMBER", label: "Member" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "STUDENT", label: "Student" },
  { value: "EXHIBITING_ARTIST", label: "Exhibiting artist" },
  { value: "GRANTEE", label: "Grantee" },
  { value: "IN_SHOP", label: "In shop" },
];

const OFFERING_OPTIONS = [
  { value: "sell_existing", label: "Sell existing artwork" },
  { value: "custom_artwork", label: "Make custom artwork" },
  { value: "classes", label: "Teach classes, lessons, or workshops" },
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

export default function OnboardingForm({ initialData }: { places: Place[]; userEmail: string; initialData: InitialData }) {
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const bioPhotoInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null); // kept for scroll-to on finish validation

  // Profile fields
  const [name, setName] = useState(initialData?.name ?? "");
  const [medium, setMedium] = useState(initialData?.medium ?? "");
  const [neighborhood, setNeighborhood] = useState(initialData?.neighborhood ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [website, setWebsite] = useState(initialData?.website ?? "");
  const [instagram, setInstagram] = useState(initialData?.instagram ?? "");

  // Places: 3 fixed rows, pre-filled from existing data
  const [places, setPlaces] = useState(() => {
    const existing = initialData?.placeRelations ?? [];
    const rows = existing.slice(0, 3).map((r) => ({ placeName: r.placeName, relationship: r.relationship }));
    while (rows.length < 3) rows.push({ placeName: "", relationship: "MEMBER" });
    return rows;
  });

  // Offerings checkboxes — reverse-map hireFor text back to option values
  const [offerings, setOfferings] = useState<string[]>(() => {
    if (!initialData?.hireFor) return [];
    return OFFERING_OPTIONS.filter((o) => initialData.hireFor.includes(o.label)).map((o) => o.value);
  });
  const [offeringsOther, setOfferingsOther] = useState("");

  // Images
  const [images, setImages] = useState<{ id: string; url: string; isHero: boolean }[]>(initialData?.images ?? []);
  const [bioPhotoUrl, setBioPhotoUrl] = useState<string | null>(initialData?.bioPhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadingBio, setUploadingBio] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [, setHasArtist] = useState(!!initialData);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [finishing, setFinishing] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroImage = images.find((img) => img.isHero) ?? images[0] ?? null;
  const galleryImages = images.filter((img) => img.id !== heroImage?.id);

  // ─── Save ────────────────────────────────────────────────────────────

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
          medium,
          neighborhood,
          hireFor: buildOfferingsText() || null,
          website,
          instagram,
          commissionStatus: "UNSPECIFIED",
          placeRelations: places
            .filter((p) => p.placeName.trim())
            .map((p) => ({ placeName: p.placeName.trim(), relationship: p.relationship })),
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
  }, [name, bio, medium, neighborhood, website, instagram, JSON.stringify(offerings), offeringsOther, JSON.stringify(places)]);

  // ─── Images ──────────────────────────────────────────────────────────

  async function uploadFile(file: File, fields: Record<string, string>) {
    const form = new FormData();
    form.append("file", file);
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

  function setHero(id: string) {
    setImages((prev) => prev.map((img) => ({ ...img, isHero: img.id === id })));
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

  const subtitle = [medium, neighborhood].filter(Boolean).join(" · ");

  return (
    <div>
      {/* ── Hero + bio photo (full bleed) ────────────────────────────── */}
      <div className="relative mb-16">
        {/* Top bar floated over hero */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/30 to-transparent">
          <p className="font-heading text-sm font-bold text-white/80">Build your profile</p>
          <div className="flex items-center gap-3">
            {saveStatus === "saving" && <span className="text-white/60 text-xs">Saving…</span>}
            {saveStatus === "saved" && <span className="text-white/60 text-xs">Saved</span>}
            {saveStatus === "error" && <span className="text-red-300 text-xs">{errorMsg}</span>}
            <button type="button" onClick={handleFinish} disabled={finishing} className={BTN}>
              {finishing ? "Saving…" : "Done"}
            </button>
          </div>
        </div>

        {/* Hero image — full bleed */}
        <div className="w-full bg-[#f0ede9] overflow-hidden" style={{ aspectRatio: "2.5 / 1" }}>
          {heroImage ? (
            <label className="block w-full h-full cursor-pointer group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage.url} alt="" className="w-full h-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all opacity-0 group-hover:opacity-100">
                <span className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-full">
                  {uploading ? "Uploading…" : "Change header image"}
                </span>
              </span>
              <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleHeroSelect} className="hidden" />
            </label>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-1">
              <span className="text-[#bbb] text-sm">{uploading ? "Uploading…" : "+ Add header image"}</span>
              <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleHeroSelect} className="hidden" />
            </label>
          )}
        </div>

        {/* Bio photo circle — overlaps hero bottom-left */}
        <label
          className="absolute -bottom-12 left-4 cursor-pointer"
        >
          {bioPhotoUrl ? (
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bioPhotoUrl} alt="" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#e8e3dc] border-4 border-white shadow-sm flex flex-col items-center justify-center hover:bg-[#ddd8d0] transition-colors">
              <span className="text-[#aaa] text-[11px] text-center leading-tight px-2">
                {uploadingBio ? "…" : "+ Photo"}
              </span>
            </div>
          )}
          <input ref={bioPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBioPhotoSelect} className="hidden" />
        </label>
      </div>

      {/* ── Constrained content ──────────────────────────────────────── */}
      <div className="max-w-[980px] mx-auto px-4 sm:px-10 pb-16">

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
          <div className="flex-1 min-w-[140px]">
            <input
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="e.g. Ceramicist"
              className={FIELD}
            />
            <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mt-1.5 ml-1">Type of artist</p>
          </div>
          <div className="flex-1 min-w-[160px]">
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="e.g. Multnomah Village"
              className={FIELD}
            />
            <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mt-1.5 ml-1">Neighborhood</p>
          </div>
        </div>
      </div>

      {/* ── Bio ───────────────────────────────────────────────────────── */}
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={5}
        placeholder="Tell visitors about yourself and your work, your background, what you make, and what inspires you."
        className={`${FIELD} leading-relaxed resize-none mb-4`}
      />

      {/* ── Links ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            className={FIELD}
          />
          <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mt-1.5 ml-1">Website</p>
        </div>
        <div className="flex-1 min-w-[160px]">
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/yourhandle"
            className={FIELD}
          />
          <p className="text-[0.72rem] font-semibold text-[#1a1a1a] mt-1.5 ml-1">Social media page</p>
        </div>
      </div>

      {/* ── Community / places ────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-[0.7rem] font-semibold text-[#aaa] uppercase tracking-widest mb-3">Community</h2>
        <div className="space-y-2">
          {places.map((rel, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={rel.placeName}
                onChange={(e) => setPlaces((prev) => prev.map((p, idx) => idx === i ? { ...p, placeName: e.target.value } : p))}
                placeholder="e.g. Multnomah Arts Center"
                className={`${FIELD} flex-1`}
              />
              <select
                value={rel.relationship}
                onChange={(e) => setPlaces((prev) => prev.map((p, idx) => idx === i ? { ...p, relationship: e.target.value } : p))}
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
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPlaces((prev) => [...prev, { placeName: "", relationship: "MEMBER" }])}
          className="mt-3 text-[0.82rem] text-[#999] hover:text-[#1a1a1a] transition-colors"
        >
          + Add another place
        </button>
      </div>

      {/* ── Work gallery (max 3) ──────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-[0.7rem] font-semibold text-[#aaa] uppercase tracking-widest">Work</h2>
          <span className="text-[0.7rem] text-[#bbb]">up to 3 photos</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((slot) => {
            const img = galleryImages[slot];
            return img ? (
              <div
                key={img.id}
                onClick={() => setHero(img.id)}
                title="Click to make this your header image"
                className="rounded-lg overflow-hidden bg-[#f0ede9] aspect-square cursor-pointer hover:opacity-80 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
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
        <h2 className="font-heading text-base font-bold text-[#1a1a1a] mb-1">Additional details</h2>
        <p className="text-[#666] text-sm mb-6">
          How can people work with you or purchase your artwork?
        </p>

        <fieldset className="mb-4">
          <legend className={LABEL}>What do you currently offer?</legend>
          <div className="space-y-2.5">
            {OFFERING_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${offerings.includes(opt.value) ? "bg-[#1a1a1a] border-[#1a1a1a]" : "border-[#ddd] group-hover:border-[#999]"}`}
                  onClick={() => toggleOffering(opt.value)}
                >
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
                className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center mt-0.5 transition-colors ${offeringsOther.trim() ? "bg-[#1a1a1a] border-[#1a1a1a]" : "border-[#ddd] group-hover:border-[#999]"}`}
                onClick={() => !offeringsOther.trim() && document.getElementById("offerings-other")?.focus()}
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
