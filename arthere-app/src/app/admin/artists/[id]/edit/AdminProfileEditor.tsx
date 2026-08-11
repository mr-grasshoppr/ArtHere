"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateArtistProfile } from "../actions";
import { MEDIUM_OPTIONS, OFFERING_OPTIONS, LINK_TYPE_OPTIONS } from "@/lib/artist-options";

type Place = { id: string; name: string; neighborhood: string | null };
type PlaceRelation = { placeId?: string; venueName?: string; relationship: string; relationshipLabel?: string };
type OtherConnection = { name: string; relationship: string; relationshipLabel?: string };
type Link = { type: string; url: string; label?: string };

type Artist = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  quote: string | null;
  otherConnections: { name: string; relationship: string; relationshipLabel: string | null }[];
  medium: string | null;
  neighborhood: string | null;
  offerings: string[];
  placeRelations: { placeId: string | null; venueName: string | null; relationship: string; relationshipLabel: string | null; place: Place | null }[];
  links: { type: string; url: string; label: string | null }[];
};

const RELATIONSHIP_TYPES = [
  { value: "MEMBER", label: "Member" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "STUDENT", label: "Student" },
  { value: "EXHIBITING_ARTIST", label: "Exhibiting artist" },
  { value: "GRANTEE", label: "Grantee" },
  { value: "IN_SHOP", label: "In shop" },
  { value: "OTHER", label: "Other…" },
];

const inputCls =
  "w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999] text-sm";
const labelCls = "block text-xs text-[#888] uppercase tracking-wide mb-1.5";
const selectCls =
  "px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] focus:outline-none focus:border-[#999] text-sm";
const pillCls = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-sm border transition-colors ${
    active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-[#666] border-[#e5e5e5] hover:border-[#999]"
  }`;

function parseMedium(raw: string | null): { selected: Set<string>; other: string } {
  const parts = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const selected = new Set(parts.filter((p) => MEDIUM_OPTIONS.includes(p)));
  const other = parts.filter((p) => !MEDIUM_OPTIONS.includes(p)).join(", ");
  return { selected, other };
}

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

  const [firstName, setFirstName] = useState(artist.firstName ?? "");
  const [lastName, setLastName] = useState(artist.lastName ?? "");
  const [bio, setBio] = useState(artist.bio ?? "");
  const [quote, setQuote] = useState(artist.quote ?? "");
  const [otherConnections, setOtherConnections] = useState<OtherConnection[]>(
    artist.otherConnections.map((c) => ({ name: c.name, relationship: c.relationship, relationshipLabel: c.relationshipLabel ?? "" }))
  );
  const [neighborhood, setNeighborhood] = useState(artist.neighborhood ?? "");

  const initialMedium = parseMedium(artist.medium);
  const [mediumSelected, setMediumSelected] = useState<Set<string>>(initialMedium.selected);
  const [mediumOther, setMediumOther] = useState(initialMedium.other);
  const [showMediumOther, setShowMediumOther] = useState(initialMedium.other.length > 0);

  const initialChecked = new Set(artist.offerings.filter((o) => OFFERING_OPTIONS.some((opt) => opt.label === o)));
  const initialCustom = artist.offerings.filter((o) => !OFFERING_OPTIONS.some((opt) => opt.label === o));
  const [offeringsChecked, setOfferingsChecked] = useState<Set<string>>(initialChecked);
  const [customOfferings, setCustomOfferings] = useState<string[]>(initialCustom);

  const [placeRelations, setPlaceRelations] = useState<PlaceRelation[]>(
    artist.placeRelations.map((r) => ({
      placeId: r.placeId ?? undefined,
      venueName: r.venueName ?? undefined,
      relationship: r.relationship,
      relationshipLabel: r.relationshipLabel ?? "",
    }))
  );

  const [links, setLinks] = useState<Link[]>(
    artist.links.map((l) => ({ type: l.type, url: l.url, label: l.label ?? "" }))
  );

  function toggleMedium(option: string) {
    setMediumSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  }

  function toggleOffering(label: string) {
    setOfferingsChecked((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    setError("");
    setSaved(false);

    const medium = [...mediumSelected, ...(mediumOther.trim() ? [mediumOther.trim()] : [])].join(", ");
    const offerings = [
      ...OFFERING_OPTIONS.filter((opt) => offeringsChecked.has(opt.label)).map((opt) => opt.label),
      ...customOfferings.map((o) => o.trim()).filter(Boolean),
    ];

    startTransition(async () => {
      try {
        await updateArtistProfile(artist.id, {
          firstName,
          lastName,
          bio,
          quote,
          otherConnections,
          medium,
          neighborhood,
          offerings,
          placeRelations,
          links,
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

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelCls}>First name *</label>
            <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
          </div>
          <div className="flex-1">
            <label className={labelCls}>Last name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Neighborhood</label>
          <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. SE Portland" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Pull quote</label>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={2}
            placeholder="A short quote shown above the bio"
            className={`${inputCls} resize-y`}
          />
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className={`${inputCls} resize-y`} />
        </div>
      </section>

      {/* Medium */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Medium</h2>
        <div className="flex flex-wrap gap-2">
          {MEDIUM_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleMedium(option)}
              className={pillCls(mediumSelected.has(option))}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowMediumOther((v) => !v)}
            className={pillCls(showMediumOther)}
          >
            Other…
          </button>
        </div>
        {showMediumOther && (
          <input
            type="text"
            value={mediumOther}
            onChange={(e) => setMediumOther(e.target.value)}
            placeholder="e.g. Printmaking, glasswork"
            className={inputCls}
          />
        )}
      </section>

      {/* Offerings */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <div>
          <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">What are they offering?</h2>
          <p className="text-xs text-[#aaa] mt-1">People will find this artist when they search for artists who are teaching, taking commissions, etc.</p>
        </div>
        <div className="space-y-2">
          {OFFERING_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm text-[#444] cursor-pointer">
              <input
                type="checkbox"
                checked={offeringsChecked.has(opt.label)}
                onChange={() => toggleOffering(opt.label)}
                className="w-4 h-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {customOfferings.length > 0 && (
          <div className="space-y-2">
            {customOfferings.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setCustomOfferings((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                  placeholder="Custom offering"
                  className={`flex-1 ${inputCls}`}
                />
                <button
                  type="button"
                  onClick={() => setCustomOfferings((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[#ccc] hover:text-red-400 text-lg leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setCustomOfferings((prev) => [...prev, ""])}
          className="text-sm text-[#888] border border-dashed border-[#e5e5e5] px-4 py-2 rounded-lg hover:border-[#999] transition-colors"
        >
          + Add another option
        </button>
      </section>

      {/* Links */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-1">Links</h2>
        {links.map((link, i) => {
          const meta = LINK_TYPE_OPTIONS.find((t) => t.value === link.type) ?? LINK_TYPE_OPTIONS[0];
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <select
                  value={link.type}
                  onChange={(e) => setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, type: e.target.value } : l)))}
                  className={selectCls}
                >
                  {LINK_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)))}
                  placeholder={meta.placeholder}
                  className={`flex-1 ${inputCls}`}
                />
                <button
                  type="button"
                  onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[#ccc] hover:text-red-400 text-lg leading-none transition-colors"
                >
                  ×
                </button>
              </div>
              {link.type === "OTHER" && (
                <input
                  type="text"
                  value={link.label ?? ""}
                  onChange={(e) => setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, label: e.target.value } : l)))}
                  placeholder="Label, e.g. Etsy shop"
                  className={`${inputCls} text-sm`}
                />
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setLinks((prev) => [...prev, { type: "WEBSITE", url: "" }])}
          className="text-sm text-[#888] border border-dashed border-[#e5e5e5] px-4 py-2 rounded-lg hover:border-[#999] transition-colors"
        >
          + Add link
        </button>
      </section>

      {/* Places */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-1">Place Connections</h2>
        {placeRelations.map((rel, i) => {
          const isOther = !rel.placeId;
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <select
                  value={rel.placeId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPlaceRelations((prev) =>
                      prev.map((r, idx) =>
                        idx === i
                          ? v === ""
                            ? { ...r, placeId: undefined }
                            : { ...r, placeId: v, venueName: undefined }
                          : r
                      )
                    );
                  }}
                  className={`flex-1 ${selectCls}`}
                >
                  <option value="">Not listed yet — type name below</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.neighborhood ? ` · ${p.neighborhood}` : ""}
                    </option>
                  ))}
                </select>
                <select
                  value={rel.relationship}
                  onChange={(e) =>
                    setPlaceRelations((prev) => prev.map((r, idx) => idx === i ? { ...r, relationship: e.target.value, relationshipLabel: "" } : r))
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
              {isOther && (
                <input
                  type="text"
                  value={rel.venueName ?? ""}
                  onChange={(e) => setPlaceRelations((prev) => prev.map((r, idx) => idx === i ? { ...r, venueName: e.target.value } : r))}
                  placeholder="Venue name — won't link anywhere until it's added to Art Here"
                  className={`${inputCls} text-sm`}
                />
              )}
              {rel.relationship === "OTHER" && (
                <input
                  type="text"
                  value={rel.relationshipLabel ?? ""}
                  onChange={(e) => setPlaceRelations((prev) => prev.map((r, idx) => idx === i ? { ...r, relationshipLabel: e.target.value } : r))}
                  placeholder="Describe the connection…"
                  className={`${inputCls} text-sm`}
                />
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setPlaceRelations((prev) => [...prev, { relationship: "MEMBER" }])}
          className="text-sm text-[#888] border border-dashed border-[#e5e5e5] px-4 py-2 rounded-lg hover:border-[#999] transition-colors"
        >
          + Add place
        </button>
      </section>

      {/* Other connections */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <div>
          <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Other Connections</h2>
          <p className="text-xs text-[#aaa] mt-1">Affiliations outside the artist's local area.</p>
        </div>
        {otherConnections.map((conn, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={conn.name}
                onChange={(e) => setOtherConnections((prev) => prev.map((c, idx) => (idx === i ? { ...c, name: e.target.value } : c)))}
                placeholder="e.g. Oregon Watercolor Society"
                className={`flex-1 ${inputCls}`}
              />
              <select
                value={conn.relationship}
                onChange={(e) =>
                  setOtherConnections((prev) => prev.map((c, idx) => idx === i ? { ...c, relationship: e.target.value, relationshipLabel: "" } : c))
                }
                className={selectCls}
              >
                {RELATIONSHIP_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setOtherConnections((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-[#ccc] hover:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>
            {conn.relationship === "OTHER" && (
              <input
                type="text"
                value={conn.relationshipLabel ?? ""}
                onChange={(e) => setOtherConnections((prev) => prev.map((c, idx) => idx === i ? { ...c, relationshipLabel: e.target.value } : c))}
                placeholder="Describe the connection…"
                className={`${inputCls} text-sm`}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOtherConnections((prev) => [...prev, { name: "", relationship: "MEMBER", relationshipLabel: "" }])}
          className="text-sm text-[#888] border border-dashed border-[#e5e5e5] px-4 py-2 rounded-lg hover:border-[#999] transition-colors"
        >
          + Add connection
        </button>
      </section>

      {/* Actions */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">Saved successfully.</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !firstName.trim()}
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
