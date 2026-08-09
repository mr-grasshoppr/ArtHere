import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { getMediumOptions } from "@/lib/medium-options";
import ArtworkReviewGrid from "./ArtworkReviewGrid";

// Images the AI either hasn't tagged yet or tagged with no confident medium
// match — both cases land here so an admin can hand-tag them once, rather
// than the artwork page silently guessing (or leaking the artist's overall
// mediums onto a piece they don't apply to).
export default async function ArtworkReviewPage() {
  await requireAdminPage();

  const [images, mediumOptions] = await Promise.all([
    prisma.artworkImage.findMany({
      where: { medium: { isEmpty: true } },
      include: { artist: { select: { id: true, name: true, slug: true, medium: true } } },
      orderBy: { uploadedAt: "desc" },
    }),
    getMediumOptions(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Artwork Needing Review</h1>
        <p className="text-sm text-[#888] mt-1">
          {images.length === 0
            ? "Everything is tagged — nothing needs manual review."
            : `${images.length} piece${images.length === 1 ? "" : "s"} without a confident AI medium match. Tag each one so it shows up correctly in artwork search/filters.`}
        </p>
      </div>

      <ArtworkReviewGrid
        images={images.map((img) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          medium: img.medium,
          artist: img.artist,
        }))}
        initialMediumOptions={mediumOptions}
      />
    </div>
  );
}
