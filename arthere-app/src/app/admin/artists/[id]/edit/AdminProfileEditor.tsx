"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateArtistProfile } from "../actions";

type Place = { id: string; name: string; neighborhood: string | null };
type PlaceRelation = { placeId: string; relationship: string };

type Artist = {
  id: string;
  name: string;
  bio: string | null;
  medium: string | null;
  neighborhood: string | null;
  hireFor: string | null;
  website: string | null;
  instagram: string | null;
  placeRelations: { placeId: string; relationship: string; place: Place }[];
};

const RELATIONSHIP_TYPES = [
  { value: "MEMBER", label: "Member" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "STUDENT", label: "Student" },
  { value: "EXHIBITING_ARTIST", label: "Exhibiting artist" },
  { value: "GRANTEE", label: "Grantee" },
];

const inputCls =
  "w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999] text-sm";
const labelCls = "block text-xs text-[#888] uppercase tracking-wide mb-1.5";
const selectCls =
  "px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] focus:outline-none focus:border-[#999] text-sm";

export default function AdminProfileEditor({
  artist,
  places,
}: {
  artist: Artist;
  places: Place[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(artist.name);
  const [bio, setBio] = useState(artist.bio ?? "");
  const [medium, setMedium] = useState(artist.medium ?? "");
  const [neighborhood, setNeighborhood] = useState(artist.neighborhood ?? "");
  const [hireFor, setHireFor] = useState(artist.hireFor ?? "");
  const [website, setWebsite] = useState(artist.website ?? "");
  const [instagram, setInstagram] = useState(artist.instagram ?? "");
  const [placeRelations, setPlaceRelations] = useState<PlaceRelation[]>(
    artist.placeRelations.map((r) => ({ placeId: r.placeId, relationship: r.relationship }))
  );


  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSaved(false);

    startTransition(async () => {
      try {
        await updateArtistProfile(artist.id, {
          name,
          bio,
          medium,
          neighborhood,
          hireFor,
          website,
          instagram,
          placeRelations,
        });
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Basic info */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Basic Info</h2>

        <div>
          <label className={labelCls}>Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Medium</label>
            <input type="text" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="e.g. Oil painting, ceramics" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Neighborhood</label>
            <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. SE Portland" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className={`${inputCls} resize-y`} />
        </div>

        <div>
          <label className={labelCls}>Hire for</label>
          <textarea value={hireFor} onChange={(e) => setHireFor(e.target.value)} rows={3} placeholder="What would someone hire this artist for?" className={`${inputCls} resize-y`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Website</label>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Instagram</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" className={inputCls} />
          </div>
        </div>
      </section>

      {/* Places */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-1">Place Connections</h2>
        {placeRelations.map((rel, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={rel.placeId}
              onChange={(e) =>
                setPlaceRelations((prev) => prev.map((r, idx) => idx === i ? { ...r, placeId: e.target.value } : r))
              }
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
              onChange={(e) =>
                setPlaceRelations((prev) => prev.map((r, idx) => idx === i ? { ...r, relationship: e.target.value } : r))
              }
              className={selectCls}
            >
              {RELATIONSHIP_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPlaceRelations((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-[#ccc] hover:text-red-400 text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPlaceRelations((prev) => [...prev, { placeId: "", relationship: "MEMBER" }])}
          className="text-sm text-[#888] border border-dashed border-[#e5e5e5] px-4 py-2 rounded-lg hover:border-[#999] transition-colors"
        >
          + Add place
        </button>
      </section>

      {/* Actions */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">Saved successfully.</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="px-6 py-2.5 bg-[#1a1a1a] text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-sm text-[#888] border border-[#e5e5e5] rounded-full hover:border-[#999] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
