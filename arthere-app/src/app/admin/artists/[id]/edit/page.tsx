import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminProfileEditor from "./AdminProfileEditor";
import AdminImageManager from "./AdminImageManager";
import ArtistNotes from "../ArtistNotes";
import { SendInviteButton } from "../SendInviteButton";
import VisibilityToggle from "../../VisibilityToggle";
import { getFocals } from "@/lib/image-focus";
import { getMediumOptions } from "@/lib/medium-options";

// The one page for viewing AND editing an artist profile — deliberately not
// split across a read-only detail page and a separate edit page anymore.
// That split meant the owner email (admin-only) lived on a different page
// from the rest of the editable fields, with its own half-finished "send
// invite" flow standing in for "save" — confusing, and it looked like saves
// were silently failing. Everything admin-editable now lives in one form on
// one page; the "Admin Only" box inside AdminProfileEditor saves via the
// same Save button as everything else.
export default async function AdminArtistPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      user: true,
      artworkImages: { orderBy: { sortOrder: "asc" } },
      placeRelations: { include: { place: true } },
      otherConnections: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
      intake: true,
      adminNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!artist) notFound();

  const [places, cities, mediumOptions, initialFocals] = await Promise.all([
    prisma.place.findMany({ where: { inDirectory: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    getMediumOptions(),
    getFocals([artist.bioPhotoUrl, ...artist.artworkImages.map((img) => img.url)]).then(Object.fromEntries),
  ]);

  // Every save (self-service or admin) writes one of these — surfacing it is
  // the only reliable way to answer "have they actually touched this," since
  // Artist.updatedAt alone doesn't say who changed it.
  const revisions = await prisma.profileRevision.findMany({
    where: { entityType: "artist", entityId: artist.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { editedBy: true, editorEmail: true, createdAt: true },
  });
  const lastArtistEdit = revisions.find((r) => r.editedBy === "artist");

  const blockedAccess = await prisma.blockedAccessAttempt.findMany({
    where: { artistId: artist.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin/artists" className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors">
          ← All Artists
        </Link>
        <Link
          href={`/artists/${artist.slug}`}
          target="_blank"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#e0e0e0] text-xs font-medium text-[#444] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
        >
          View public profile ↗
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
                {new Date(b.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {" — "}
                {b.email} ({b.reason})
              </p>
            ))}
          </div>
        </div>
      )}

      {artist.submittedForReviewAt && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-[#f062a4]/10 border border-[#f062a4]/25 rounded-lg px-5 py-3">
          <p className="text-sm text-[#a84573]">
            <span className="font-medium">Ready for review</span> — submitted{" "}
            {new Date(artist.submittedForReviewAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <VisibilityToggle artistId={artist.id} isPlaceholder={artist.isPlaceholder} />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: identity + activity */}
        <div className="md:col-span-1 space-y-6">
          {artist.bioPhotoUrl && (
            <img
              src={artist.bioPhotoUrl}
              alt={artist.name}
              className="w-full aspect-square object-cover rounded-xl bg-[#f0f0f0]"
            />
          )}

          <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
            <div>
              <h1 className="text-xl font-medium">{artist.name}</h1>
              <p className="text-sm text-[#888]">/{artist.slug}</p>
            </div>

            <div className="text-sm space-y-1 pt-2 border-t border-[#f0f0f0]">
              <Row label="Email" value={artist.user?.email ?? null} />
              {artist.user && (
                <Row label="Logged in" value={artist.user.emailVerified ? new Date(artist.user.emailVerified).toLocaleDateString() : "Never"} />
              )}
              <Row
                label="Last edit"
                value={
                  lastArtistEdit
                    ? `${new Date(lastArtistEdit.createdAt).toLocaleDateString()} (by artist)`
                    : "Never edited by artist"
                }
              />
              {commissionLabel[artist.commissionStatus] && (
                <Row label="Commissions" value={commissionLabel[artist.commissionStatus]} />
              )}
              {artist.priceRangeMin != null && (
                <Row label="Price range" value={`$${artist.priceRangeMin}–$${artist.priceRangeMax ?? "?"}`} />
              )}
              {artist.sizeRangeMin != null && (
                <Row label="Size range" value={`${artist.sizeRangeMin}–${artist.sizeRangeMax ?? "?"} in`} />
              )}
            </div>

            <div className="pt-3 border-t border-[#f0f0f0]">
              <SendInviteButton
                artistId={artist.id}
                editHref={`/admin/artists/${id}/edit`}
                email={artist.user?.email ?? null}
              />
            </div>
          </div>

          {revisions.length > 0 && (
            <div className="bg-white border border-[#e5e5e5] rounded-lg p-5">
              <p className="text-xs text-[#999] mb-3 uppercase tracking-wide">Recent Activity</p>
              <div className="space-y-2">
                {revisions.map((r, i) => (
                  <div key={i} className="text-sm flex items-baseline justify-between gap-2">
                    <span className="text-[#444]">
                      {r.editedBy === "artist" ? "Edited by artist" : r.editedBy === "admin" ? `Edited by admin${r.editorEmail ? ` (${r.editorEmail})` : ""}` : "System update"}
                    </span>
                    <span className="text-[#bbb] text-xs flex-shrink-0">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: everything editable, plus notes */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-4">Images</h2>
            <AdminImageManager
              artistId={artist.id}
              initialImages={artist.artworkImages}
              initialBioPhotoUrl={artist.bioPhotoUrl}
              initialFocals={initialFocals}
              initialMediumOptions={mediumOptions}
            />
          </div>

          <AdminProfileEditor
            artist={{ ...artist, email: artist.user?.email ?? null }}
            places={places}
            cities={cities.map((c) => ({
              id: c.id,
              label: c.slug.endsWith("-demo") ? `${c.displayName ?? c.name} (demo preview only)` : c.displayName ?? c.name,
            }))}
          />

          <ArtistNotes artistId={artist.id} initialNotes={artist.adminNotes} />
        </div>
      </div>
    </div>
  );
}

const commissionLabel: Record<string, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  ON_REQUEST: "On request",
  UNSPECIFIED: "",
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[#999] w-24 flex-shrink-0">{label}</span>
      <span className="text-[#1a1a1a] truncate">{value}</span>
    </div>
  );
}
