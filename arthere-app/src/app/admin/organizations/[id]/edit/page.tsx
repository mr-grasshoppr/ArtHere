import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrgEditor from "./OrgEditor";
import PlaceNotes from "../PlaceNotes";
import PlaceTeam from "../PlaceTeam";
import { SendPlaceInviteButton } from "../SendPlaceInviteButton";
import OrgVisibilityToggle from "../../OrgVisibilityToggle";
import { getFocals } from "@/lib/image-focus";
import { getKnownNeighborhoods } from "@/lib/neighborhoods";

// The one page for viewing AND editing an organization — mirrors
// /admin/artists/[id]/edit. Notes, team, sign-in problems and the invite used
// to live on a separate read-only detail page, so the owner email (editable
// only here) was one click away from the "send invite" that depends on it.
// Everything now lives on this page; the bare /admin/organizations/[id] route
// just redirects here.
export default async function AdminOrgEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, emailVerified: true } },
      listedArtists: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
      locations: { orderBy: { sortOrder: "asc" } },
      adminNotes: { where: { placeId: id }, orderBy: { createdAt: "desc" } },
      members: { select: { userId: true, user: { select: { email: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!place) notFound();

  const [initialFocalsEntries, neighborhoodOptions, blockedAccess, revisions] = await Promise.all([
    getFocals([place.heroImageUrl, place.thumbnailImageUrl, ...place.galleryImages]),
    getKnownNeighborhoods(),
    prisma.blockedAccessAttempt.findMany({ where: { placeId: place.id }, orderBy: { createdAt: "desc" } }),
    // Every save (self-service or admin) writes one of these — the only
    // reliable way to answer "have they actually touched this."
    prisma.profileRevision.findMany({
      where: { entityType: "place", entityId: place.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { editedBy: true, editorEmail: true, createdAt: true },
    }),
  ]);
  const initialFocals = Object.fromEntries(initialFocalsEntries);
  const lastOwnerEdit = revisions.find((r) => r.editedBy === "place");

  const team = [
    ...(place.userId && place.user ? [{ userId: place.userId, email: place.user.email, role: "owner" as const }] : []),
    ...place.members.map((m) => ({ userId: m.userId, email: m.user.email, role: "member" as const })),
  ];

  const tz = "America/Los_Angeles";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin/organizations" className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors">
          ← All Organizations
        </Link>
        <Link
          href={`/places/${place.slug}`}
          target="_blank"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#e0e0e0] text-xs font-medium text-[#444] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
        >
          View page ↗
        </Link>
      </div>

      {blockedAccess.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-5 py-3">
          <p className="text-sm text-red-700 font-medium mb-1.5">
            ⚠ {blockedAccess.length} blocked sign-in attempt{blockedAccess.length === 1 ? "" : "s"}
          </p>
          <div className="space-y-1">
            {blockedAccess.map((b) => (
              <p key={b.id} className="text-xs text-red-600">
                {new Date(b.createdAt).toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {" — "}
                {b.email} ({b.reason})
              </p>
            ))}
          </div>
        </div>
      )}

      {place.submittedForReviewAt && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-[#f062a4]/10 border border-[#f062a4]/25 rounded-lg px-5 py-3">
          <p className="text-sm text-[#a84573]">
            <span className="font-medium">Ready for review</span> — submitted{" "}
            {new Date(place.submittedForReviewAt).toLocaleString("en-US", {
              timeZone: tz,
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
        {/* Left: identity + activity */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
            <div>
              <h1 className="text-xl font-medium">{place.name}</h1>
              <p className="text-sm text-[#888]">/{place.slug}</p>
            </div>

            <div className="text-sm space-y-1 pt-2 border-t border-[#f0f0f0]">
              <Row label="Email" value={place.user?.email ?? null} />
              {place.user && (
                <Row label="Logged in" value={place.user.emailVerified ? new Date(place.user.emailVerified).toLocaleDateString("en-US", { timeZone: tz }) : "Never"} />
              )}
              <Row
                label="Last edit"
                value={
                  lastOwnerEdit
                    ? `${new Date(lastOwnerEdit.createdAt).toLocaleDateString("en-US", { timeZone: tz })} (by owner)`
                    : "Never edited by owner"
                }
              />
              <Row label="Directory" value={place.inDirectory ? "Live" : "Hidden"} />
            </div>

            <div className="pt-3 border-t border-[#f0f0f0]">
              <SendPlaceInviteButton placeId={place.id} email={place.user?.email ?? null} />
            </div>
          </div>

          {revisions.length > 0 && (
            <div className="bg-white border border-[#e5e5e5] rounded-lg p-5">
              <p className="text-xs text-[#999] mb-3 uppercase tracking-wide">Recent Activity</p>
              <div className="space-y-2">
                {revisions.map((r, i) => (
                  <div key={i} className="text-sm flex items-baseline justify-between gap-2">
                    <span className="text-[#444]">
                      {r.editedBy === "place" ? "Edited by owner" : r.editedBy === "admin" ? `Edited by admin${r.editorEmail ? ` (${r.editorEmail})` : ""}` : "System update"}
                    </span>
                    <span className="text-[#bbb] text-xs flex-shrink-0">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: everything editable, plus team and notes */}
        <div className="md:col-span-2 space-y-8">
          <OrgEditor
            place={{
              id: place.id,
              name: place.name,
              neighborhood: place.neighborhood ?? "",
              description: place.description ?? "",
              quote: place.quote ?? "",
              quoteAttribution: place.quoteAttribution ?? "",
              links: place.links.map((l) => ({ type: l.type, url: l.url, label: l.label ?? "" })),
              email: place.user?.email ?? "",
              heroImageUrl: place.heroImageUrl,
              thumbnailImageUrl: place.thumbnailImageUrl,
              galleryImages: place.galleryImages,
              inDirectory: place.inDirectory,
              locations: place.locations.map((l) => ({ label: l.label ?? "", streetAddress: l.streetAddress })),
              unresolvedAddresses: place.locations.filter((l) => l.lat == null).map((l) => l.streetAddress),
              showOnMap: place.showOnMap,
              listedArtists: place.listedArtists.map((a) => ({ name: a.name, relationship: a.relationship, relationshipLabel: a.relationshipLabel })),
            }}
            neighborhoodOptions={neighborhoodOptions}
            initialFocals={initialFocals}
          />
          <PlaceTeam placeId={place.id} initialTeam={team} />
          <PlaceNotes placeId={place.id} initialNotes={place.adminNotes} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[#999] w-24 flex-shrink-0">{label}</span>
      <span className="text-[#1a1a1a] truncate">{value}</span>
    </div>
  );
}
