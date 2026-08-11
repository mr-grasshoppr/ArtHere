import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";
import ArtistCharts from "./ArtistCharts";
import ArtistsList from "./ArtistsList";
import NewArtistForm from "./NewArtistForm";
import { InviteInterestedButton } from "./InviteInterestedButton";
import { SendInviteButton } from "./[id]/SendInviteButton";
import { mediumMatches, parseMediumList } from "@/lib/artist-options";

// Which contact-form intents represent someone offering their own art (as
// opposed to Partner/Bring-to-my-city, which aren't artist candidates).
const ARTIST_INTENTS = ["invite", "featured"];

function tally(values: (string | null)[], total: number) {
  const counts: Record<string, number> = {};
  for (const v of values) {
    if (!v) continue;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round((count / (total || 1)) * 100) }));
}

// Artists can list more than one medium (a comma-joined field) — tally each
// individual medium rather than each distinct combination string.
function tallyMedium(values: (string | null)[], total: number) {
  return tally(values.flatMap(parseMediumList), total);
}

export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string; value?: string; tab?: string }>;
}) {
  await requireAdminPage();

  const { field: activeField, value: activeValue, tab } = await searchParams;
  const isInterestedTab = tab === "interested";

  const [interestedSubmissions, interestedPendingCount] = await Promise.all([
    prisma.contactSubmission.findMany({
      where: { intent: { in: ARTIST_INTENTS }, invitedArtistId: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.artist.count({
      where: { isPlaceholder: true, submittedForReviewAt: null, contactSubmission: { isNot: null } },
    }),
  ]);
  const interestedCount = interestedSubmissions.length + interestedPendingCount;

  const interestedPending = isInterestedTab
    ? await prisma.artist.findMany({
        where: { isPlaceholder: true, submittedForReviewAt: null, contactSubmission: { isNot: null } },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const [artistRows, lastArtistEdits] = await Promise.all([
    prisma.artist.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, emailVerified: true } },
        artworkImages: { select: { id: true, url: true, isHero: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
        adminNotes: { select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" } },
        _count: { select: { adminNotes: true } },
      },
    }),
    // Latest self-service edit per artist, in one query rather than one per
    // row — see Artist.lastArtistEditAt below.
    prisma.profileRevision.groupBy({
      by: ["entityId"],
      where: { entityType: "artist", editedBy: "artist" },
      _max: { createdAt: true },
    }),
  ]);
  const lastArtistEditMap = new Map(lastArtistEdits.map((r) => [r.entityId, r._max.createdAt]));
  const allArtists = artistRows.map((a) => ({ ...a, lastArtistEditAt: lastArtistEditMap.get(a.id) ?? null }));

  // Archived profiles are tucked out of the default view entirely — charts,
  // counts, and the list all work off `nonArchived` unless the Archived
  // filter is the active one.
  const nonArchived = allArtists.filter((a) => !a.isArchived);
  const archivedCount = allArtists.length - nonArchived.length;

  const mediumData = tallyMedium(nonArchived.map((a) => a.medium), nonArchived.length);
  const neighborhoodData = tally(nonArchived.map((a) => a.neighborhood), nonArchived.length);

  const baseArtists = activeField === "archived" ? allArtists : nonArchived;
  const artists =
    activeField && activeValue
      ? baseArtists.filter((a) => {
          if (activeField === "medium") return mediumMatches(a.medium, activeValue);
          if (activeField === "neighborhood") return a.neighborhood === activeValue;
          if (activeField === "placeholder") return String(a.isPlaceholder) === activeValue;
          if (activeField === "needsReview") return a.submittedForReviewAt != null;
          if (activeField === "archived") return String(a.isArchived) === activeValue;
          return true;
        })
      : baseArtists;

  const liveCount = nonArchived.filter((a) => !a.isPlaceholder).length;
  const needsReviewCount = nonArchived.filter((a) => a.submittedForReviewAt != null).length;
  const totalForLabel = activeField === "archived" ? archivedCount : nonArchived.length;
  const countLabel = activeField && activeValue
    ? `${artists.length} of ${totalForLabel}`
    : `${totalForLabel}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Artist Profiles</h1>
          <span className="text-sm text-[#888]">{countLabel} profiles</span>
          <span className="text-sm text-green-700">{liveCount} live</span>
          {needsReviewCount > 0 && (
            <Link
              href="/admin/artists?field=needsReview&value=true"
              className="text-sm text-[#a84573] hover:underline"
            >
              {needsReviewCount} awaiting review
            </Link>
          )}
          {archivedCount > 0 && (
            <Link href="/admin/artists?field=archived&value=true" className="text-sm text-[#999] hover:underline">
              {archivedCount} archived
            </Link>
          )}
          {activeField && activeValue && (
            <span className="text-sm bg-[#f0f0f0] px-2 py-0.5 rounded-full text-[#555]">
              {activeField === "placeholder"
                ? (activeValue === "true" ? "Placeholder" : "Real")
                : activeField === "needsReview"
                ? "Awaiting review"
                : activeField === "archived"
                ? "Archived"
                : activeValue}
              <Link href="/admin/artists" className="ml-1.5 text-[#bbb] hover:text-[#555]">✕</Link>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-xs">
            {interestedCount > 0 && (
              <Link
                href="/admin/artists?tab=interested"
                className={`px-3 py-1.5 rounded-full border transition-colors ${isInterestedTab ? "bg-blue-50 border-blue-300 text-blue-700" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
              >
                Interested ({interestedCount})
              </Link>
            )}
            <Link
              href="/admin/artists?field=placeholder&value=true"
              className={`px-3 py-1.5 rounded-full border transition-colors ${activeField === "placeholder" && activeValue === "true" ? "bg-[#f062a4]/10 border-[#f062a4]/40 text-[#a84573]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Placeholder
            </Link>
            <Link
              href="/admin/artists?field=placeholder&value=false"
              className={`px-3 py-1.5 rounded-full border transition-colors ${activeField === "placeholder" && activeValue === "false" ? "bg-green-50 border-green-300 text-green-700" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
            >
              Real
            </Link>
            {needsReviewCount > 0 && (
              <Link
                href="/admin/artists?field=needsReview&value=true"
                className={`px-3 py-1.5 rounded-full border transition-colors ${activeField === "needsReview" ? "bg-[#f062a4]/10 border-[#f062a4]/40 text-[#a84573]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
              >
                Needs review
              </Link>
            )}
            {archivedCount > 0 && (
              <Link
                href="/admin/artists?field=archived&value=true"
                className={`px-3 py-1.5 rounded-full border transition-colors ${activeField === "archived" ? "bg-[#e5e5e5] border-[#ccc] text-[#555]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`}
              >
                Archived
              </Link>
            )}
          </div>
          <a
            href="/api/admin/export/artists"
            download
            className="text-sm px-4 py-2 border border-[#e5e5e5] rounded-full text-[#555] hover:border-[#999] transition-colors"
          >
            Export CSV
          </a>
        </div>
      </div>

      {isInterestedTab ? (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-sm font-medium text-[#555] mb-3">Not yet invited</h2>
            <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
              {interestedSubmissions.length === 0 && (
                <p className="p-6 text-sm text-[#999]">No new interest — you&rsquo;re caught up.</p>
              )}
              {interestedSubmissions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium truncate">{s.name}</span>
                      <a
                        href={`mailto:${s.email}`}
                        className="text-sm text-[#666] underline underline-offset-2 decoration-[#ccc] hover:text-[#1a1a1a]"
                      >
                        {s.email}
                      </a>
                      <span className="text-xs text-[#bbb]">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    {s.social && <p className="text-sm text-[#888] truncate">{s.social}</p>}
                    {s.message && <p className="text-sm text-[#aaa] truncate">{s.message}</p>}
                  </div>
                  <InviteInterestedButton submissionId={s.id} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-[#555] mb-3">Invited — awaiting profile</h2>
            <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
              {interestedPending.length === 0 && (
                <p className="p-6 text-sm text-[#999]">Nobody&rsquo;s mid-invite right now.</p>
              )}
              {interestedPending.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate">{a.name}</span>
                    <div className="text-sm text-[#888] truncate">
                      {a.user?.email ?? "no owner yet"} · invited {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link
                    href={`/admin/artists/${a.id}`}
                    className="text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-full text-[#555] hover:border-[#999] transition-colors"
                  >
                    View profile
                  </Link>
                  <SendInviteButton artistId={a.id} initialEmail={a.user?.email ?? ""} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <NewArtistForm />
          </div>

          {nonArchived.length > 0 && (
            <ArtistCharts
              mediumData={mediumData}
              neighborhoodData={neighborhoodData}
              total={nonArchived.length}
              activeField={activeField}
              activeValue={activeValue}
            />
          )}

          <ArtistsList artists={artists} />
        </>
      )}
    </div>
  );
}
