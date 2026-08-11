import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import Link from "next/link";
import { getMediumOptions } from "@/lib/medium-options";
import ArtworkReviewGrid from "./ArtworkReviewGrid";

// Every piece of artwork for live profiles, so an admin can re-audit tags
// (not just catch gaps on new uploads) — each piece can be marked reviewed,
// which just dims it in place rather than removing it from view.
export default async function ArtworkReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; showHidden?: string }>;
}) {
  await requireAdminPage();

  const { scope, showHidden } = await searchParams;
  const untaggedOnly = scope === "untagged";
  const includeHidden = showHidden === "1";

  const [images, mediumOptions] = await Promise.all([
    prisma.artworkImage.findMany({
      where: {
        ...(untaggedOnly ? { medium: { isEmpty: true } } : {}),
        // Test/placeholder/archived profiles are noise when auditing what's
        // actually live on the site — hidden by default, revealable below.
        ...(includeHidden ? {} : { artist: { isPlaceholder: false, isArchived: false } }),
      },
      include: {
        artist: { select: { id: true, name: true, slug: true, medium: true, isPlaceholder: true, isArchived: true } },
      },
      orderBy: { uploadedAt: "desc" },
    }),
    getMediumOptions(),
  ]);

  const reviewedCount = images.filter((img) => img.tagsReviewedAt != null).length;

  const pillCls = (active: boolean) =>
    `px-3 py-1.5 rounded-full border text-xs transition-colors ${
      active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"
    }`;

  const scopeParam = untaggedOnly ? "scope=untagged&" : "";

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-medium">Artwork Review</h1>
          <p className="text-sm text-[#888] mt-1">
            {images.length === 0
              ? "Nothing to show with this filter."
              : `${images.length} image${images.length === 1 ? "" : "s"} · ${reviewedCount} reviewed · ${images.length - reviewedCount} remaining`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/artwork-review${includeHidden ? "?showHidden=1" : ""}`} className={pillCls(!untaggedOnly)}>
            All images
          </Link>
          <Link href={`/admin/artwork-review?scope=untagged${includeHidden ? "&showHidden=1" : ""}`} className={pillCls(untaggedOnly)}>
            Untagged only
          </Link>
          <Link
            href={`/admin/artwork-review?${scopeParam}showHidden=${includeHidden ? "0" : "1"}`}
            className={pillCls(includeHidden)}
          >
            {includeHidden ? "Hide test/non-live" : "Show test/non-live"}
          </Link>
        </div>
      </div>

      <ArtworkReviewGrid
        images={images.map((img) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          medium: img.medium,
          reviewed: img.tagsReviewedAt != null,
          artist: img.artist,
        }))}
        initialMediumOptions={mediumOptions}
      />
    </div>
  );
}
