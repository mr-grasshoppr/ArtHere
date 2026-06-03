"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Place = { id: string; name: string; neighborhood: string | null };
type ArtworkImage = { id: string; url: string; altText: string | null; isHero: boolean; sortOrder: number };
type PlaceRelation = { placeId: string; relationship: string };

type ArtistData = {
  id: string;
  name: string;
  bio: string | null;
  hireFor: string | null;
  website: string | null;
  instagram: string | null;
  commissionStatus: string;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  sizeRangeMin: number | null;
  sizeRangeMax: number | null;
  artworkImages: ArtworkImage[];
  placeRelations: Array<{ placeId: string; relationship: string; place: Place }>;
  intake: {
    commissionTypes: string[];
    turnaroundWeeks: number | null;
    shipsInternationally: boolean;
    worksInPerson: boolean;
    notes: string | null;
  } | null;
} | null;

const RELATIONSHIP_TYPES = [
  { value: "MEMBER", label: "Member" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "STUDENT", label: "Student" },
  { value: "EXHIBITING_ARTIST", label: "Exhibiting artist" },
  { value: "GRANTEE", label: "Grantee" },
];

export default function ProfileEditor({
  initialArtist,
  places,
  userEmail,
}: {
  initialArtist: ArtistData;
  places: Place[];
  userEmail: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialArtist?.name ?? "");
  const [bio, setBio] = useState(initialArtist?.bio ?? "");
  const [hireFor, setHireFor] = useState(initialArtist?.hireFor ?? "");
  const [website, setWebsite] = useState(initialArtist?.website ?? "");
  const [instagram, setInstagram] = useState(initialArtist?.instagram ?? "");
  const [commissionStatus, setCommissionStatus] = useState(
    initialArtist?.commissionStatus ?? "UNSPECIFIED"
  );
  const [priceMin, setPriceMin] = useState(String(initialArtist?.priceRangeMin ?? ""));
  const [priceMax, setPriceMax] = useState(String(initialArtist?.priceRangeMax ?? ""));
  const [sizeMin, setSizeMin] = useState(String(initialArtist?.sizeRangeMin ?? ""));
  const [sizeMax, setSizeMax] = useState(String(initialArtist?.sizeRangeMax ?? ""));

  const [placeRelations, setPlaceRelations] = useState<PlaceRelation[]>(
    initialArtist?.placeRelations.map((r) => ({
      placeId: r.placeId,
      relationship: r.relationship,
    })) ?? []
  );

  const [intake, setIntake] = useState(
    initialArtist?.intake ?? {
      commissionTypes: [] as string[],
      turnaroundWeeks: null as number | null,
      shipsInternationally: false,
      worksInPerson: false,
      notes: "",
    }
  );

  const [images, setImages] = useState<ArtworkImage[]>(initialArtist?.artworkImages ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ─── Image upload ─────────────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadError("");

    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("isHero", images.length === 0 ? "true" : "false");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json();
          setUploadError(err.error ?? "Upload failed");
        } else {
          const data = await res.json();
          setImages((prev) => [
            ...prev,
            { id: data.id, url: data.url, altText: null, isHero: data.isHero, sortOrder: prev.length },
          ]);
        }
      } catch {
        setUploadError("Upload failed. Please try again.");
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function setHero(id: string) {
    setImages((prev) => prev.map((img) => ({ ...img, isHero: img.id === id })));
  }

  // ─── Place relations ──────────────────────────────────────────────────────

  function addPlaceRelation() {
    setPlaceRelations((prev) => [...prev, { placeId: "", relationship: "MEMBER" }]);
  }

  function updatePlaceRelation(i: number, field: keyof PlaceRelation, val: string) {
    setPlaceRelations((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }

  function removePlaceRelation(i: number) {
    setPlaceRelations((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        bio,
        hireFor,
        website,
        instagram,
        commissionStatus,
        priceRangeMin: priceMin || null,
        priceRangeMax: priceMax || null,
        sizeRangeMin: sizeMin || null,
        sizeRangeMax: sizeMax || null,
        placeRelations: placeRelations.filter((r) => r.placeId && r.relationship),
        intake,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setSaveError(err.error ?? "Save failed");
      setSaving(false);
      return;
    }

    router.push("/profile");
  }

  const inputCls = "w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600";
  const labelCls = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2";
  const sectionHeadCls = "text-lg font-medium text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2";
  const selectCls = "px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600";

  return (
    <form onSubmit={handleSave} className="space-y-10">
      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Email</label>
        <p className="text-stone-800 dark:text-stone-200">{userEmail}</p>
        <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">Your email is used for sign-in only and is never shown publicly.</p>
      </div>

      {/* Basic info */}
      <section className="space-y-5">
        <h2 className={sectionHeadCls}>Basic info</h2>

        <div>
          <label className={labelCls} htmlFor="name">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            placeholder="Tell visitors about yourself and your work…"
            className={`${inputCls} resize-y`}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="hireFor">
            If someone could hire you, what would they hire you for?
          </label>
          <textarea
            id="hireFor"
            value={hireFor}
            onChange={(e) => setHireFor(e.target.value)}
            rows={3}
            placeholder="e.g. I paint large scale murals for businesses and public spaces, or I teach printmaking workshops and take custom portrait commissions"
            className={`${inputCls} resize-y`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="website">
              Website
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="instagram">
              Instagram
            </label>
            <input
              id="instagram"
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourhandle"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="space-y-4">
        <h2 className={sectionHeadCls}>Photos</h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Upload artwork images. The first photo becomes your header; click any photo to make it the header.
          Your images are used only to power search within Art Here Portland and are not used to train AI models.
        </p>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => setHero(img.id)}
                className={`relative cursor-pointer rounded-lg overflow-hidden aspect-square bg-stone-100 dark:bg-stone-800 ring-2 transition ${
                  img.isHero ? "ring-stone-800 dark:ring-stone-300" : "ring-transparent hover:ring-stone-300 dark:hover:ring-stone-600"
                }`}
              >
                <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" />
                {img.isHero && (
                  <div className="absolute bottom-0 left-0 right-0 bg-stone-900/70 text-white text-xs text-center py-1">
                    Header
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-md text-sm text-stone-600 dark:text-stone-300 cursor-pointer hover:border-stone-400 dark:hover:border-stone-500 transition ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? "Uploading…" : "+ Add photos"}
          </label>
          {uploadError && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{uploadError}</p>}
        </div>
      </section>

      {/* Place connections */}
      <section className="space-y-4">
        <h2 className={sectionHeadCls}>Places</h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Connect yourself to the studios, galleries, and arts centers you&rsquo;re part of.
        </p>

        {placeRelations.map((rel, i) => (
          <div key={i} className="flex items-center gap-3">
            <select
              value={rel.placeId}
              onChange={(e) => updatePlaceRelation(i, "placeId", e.target.value)}
              className={`flex-1 ${selectCls}`}
            >
              <option value="">Select a place…</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.neighborhood ? ` · ${p.neighborhood}` : ""}
                </option>
              ))}
            </select>
            <select
              value={rel.relationship}
              onChange={(e) => updatePlaceRelation(i, "relationship", e.target.value)}
              className={selectCls}
            >
              {RELATIONSHIP_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removePlaceRelation(i)}
              className="text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addPlaceRelation}
          className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 border border-dashed border-stone-200 dark:border-stone-700 px-4 py-2 rounded-md hover:border-stone-400 dark:hover:border-stone-500 transition"
        >
          + Add place connection
        </button>
      </section>

      {/* Commission & pricing */}
      <section className="space-y-5">
        <h2 className={sectionHeadCls}>Commissions &amp; pricing</h2>

        <div>
          <label className={labelCls}>Commission availability</label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "OPEN", label: "Open" },
              { value: "ON_REQUEST", label: "By request" },
              { value: "CLOSED", label: "Closed" },
              { value: "UNSPECIFIED", label: "Prefer not to say" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="commissionStatus"
                  value={opt.value}
                  checked={commissionStatus === opt.value}
                  onChange={() => setCommissionStatus(opt.value)}
                  className="text-stone-800 dark:text-stone-200"
                />
                <span className="text-stone-700 dark:text-stone-300 text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Price range (USD)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min"
                className={inputCls}
              />
              <span className="text-stone-400 dark:text-stone-500">–</span>
              <input
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Size range (inches)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={sizeMin}
                onChange={(e) => setSizeMin(e.target.value)}
                placeholder="Min"
                className={inputCls}
              />
              <span className="text-stone-400 dark:text-stone-500">–</span>
              <input
                type="number"
                min="0"
                value={sizeMax}
                onChange={(e) => setSizeMax(e.target.value)}
                placeholder="Max"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {commissionStatus !== "CLOSED" && commissionStatus !== "UNSPECIFIED" && (
          <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div>
              <label className={labelCls}>Types of commissions you take</label>
              <input
                type="text"
                value={intake.commissionTypes.join(", ")}
                onChange={(e) =>
                  setIntake((prev) => ({
                    ...prev,
                    commissionTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  }))
                }
                placeholder="e.g. portrait, illustration, mural, pet portrait"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Typical turnaround (weeks)</label>
                <input
                  type="number"
                  min="1"
                  value={intake.turnaroundWeeks ?? ""}
                  onChange={(e) =>
                    setIntake((prev) => ({ ...prev, turnaroundWeeks: e.target.value ? Number(e.target.value) : null }))
                  }
                  placeholder="e.g. 6"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intake.shipsInternationally}
                    onChange={(e) => setIntake((prev) => ({ ...prev, shipsInternationally: e.target.checked }))}
                  />
                  <span className="text-stone-700 dark:text-stone-300 text-sm">Ships internationally</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intake.worksInPerson}
                    onChange={(e) => setIntake((prev) => ({ ...prev, worksInPerson: e.target.checked }))}
                  />
                  <span className="text-stone-700 dark:text-stone-300 text-sm">Available to work in person</span>
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes for collectors</label>
              <textarea
                value={intake.notes ?? ""}
                onChange={(e) => setIntake((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Anything else collectors should know about working with you…"
                className={`${inputCls} resize-y`}
              />
            </div>
          </div>
        )}
      </section>

      {/* Submit */}
      {saveError && <p className="text-red-600 dark:text-red-400 text-sm">{saveError}</p>}
      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-8 py-3 rounded-md font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        <a
          href="/profile"
          className="px-8 py-3 rounded-md font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
