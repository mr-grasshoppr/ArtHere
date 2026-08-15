import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import PlaceNotes from "./PlaceNotes";
import { SendPlaceInviteButton } from "./SendPlaceInviteButton";
import { getFocalStyles } from "@/lib/image-focus";
import OrgVisibilityToggle from "../OrgVisibilityToggle";
import PlaceTeam from "./PlaceTeam";
import { linkTypeLabel } from "@/lib/artist-options";

export default async function AdminOrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      artists: { include: { artist: { select: { slug: true, name: true } } }, orderBy: { createdAt: "asc" } },
      adminNotes: { where: { placeId: id }, orderBy: { createdAt: "desc" } },
      members: { select: { userId: true, user: { select: { email: true } } }, orderBy: { createdAt: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!place) notFound();

  const team = [
    ...(place.userId && place.user ? [{ userId: place.userId, email: place.user.email, role: "owner" as const }] : []),
    ...place.members.map((m) => ({ userId: m.userId, email: m.user.email, role: "member" as const })),
  ];

  // Match the header's 21:9 crop (and its auto-detected/manual focal point)
  // so this thumbnail previews the same framing as the live page.
  const focals = await getFocalStyles([place.heroImageUrl]);
  const heroStyle = place.heroImageUrl ? focals.get(place.heroImageUrl) : undefined;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin/organizations" className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors">
          ← All Organizations
        </Link>
        <Link
          href={`/admin/organizations/${id}/edit`}
          className="text-sm px-4 py-2 bg-[#1a1a1a] text-white rounded-full hover:opacity-80 transition-opacity"
        >
          Edit page
        </Link>
      </div>

      {place.submittedForReviewAt && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-[#f062a4]/10 border border-[#f062a4]/25 rounded-lg px-5 py-3">
          <p className="text-sm text-[#a84573]">
            <span className="font-medium">Ready for review</span> — submitted{" "}
            {new Date(place.submittedForReviewAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <OrgVisibilityToggle placeId={place.id} inDirectory={place.inDirectory} />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: info */}
        <div className="md:col-span-1 space-y-6">
          {place.heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.heroImageUrl}
              alt={place.name}
              className="w-full aspect-[21/9] object-cover rounded-xl bg-[#f0f0f0]"
              style={heroStyle}
            />
          )}

          {place.galleryImages.length > 0 && (
            <div>
              <p className="text-xs text-[#999] mb-2 uppercase tracking-wide">Photos ({place.galleryImages.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {place.galleryImages.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`${place.name} photo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-md bg-[#f0f0f0]"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
            <div>
              <h1 className="text-xl font-medium">{place.name}</h1>
              <p className="text-sm text-[#888]">/{place.slug}</p>
            </div>

            <div className="text-sm space-y-1 pt-2 border-t border-[#f0f0f0]">
              <Row label="Owner email" value={place.user?.email} />
              <Row label="Neighborhood" value={place.neighborhood} />
              <Row label="Directory" value={place.inDirectory ? "Live" : "Hidden"} />
            </div>

            {place.links.length > 0 && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs text-[#999] mb-2 uppercase tracking-wide">Links</p>
                <div className="space-y-1">
                  {place.links.map((l) => (
                    <div key={l.id} className="text-sm">
                      <span className="text-[#999] mr-1">{l.label ?? linkTypeLabel(l.type)}:</span>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[#1a1a1a] hover:underline truncate">
                        {l.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {place.description && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs text-[#999] mb-1 uppercase tracking-wide">About</p>
                <p className="text-sm text-[#444] whitespace-pre-wrap leading-relaxed">{place.description}</p>
              </div>
            )}

            {place.artists.length > 0 && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs text-[#999] mb-2 uppercase tracking-wide">Artists here</p>
                <div className="space-y-1">
                  {place.artists.map((r) => (
                    <div key={r.id} className="text-sm">
                      <span className="font-medium">{r.artist.name}</span>
                      <span className="text-[#999] ml-1">({r.relationship.toLowerCase()})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#f0f0f0] flex flex-col gap-2">
              <Link
                href={`/places/${place.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#e0e0e0] text-xs font-medium text-[#444] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
              >
                View page ↗
              </Link>
              <SendPlaceInviteButton placeId={place.id} initialEmail={place.user?.email ?? ""} />
            </div>
          </div>
        </div>

        {/* Right: notes + team */}
        <div className="md:col-span-2 space-y-8">
          <PlaceNotes placeId={place.id} initialNotes={place.adminNotes} />
          <PlaceTeam placeId={place.id} initialTeam={team} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, link }: { label: string; value: string | null | undefined; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[#999] w-24 flex-shrink-0">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#1a1a1a] hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-[#1a1a1a] truncate">{value}</span>
      )}
    </div>
  );
}
