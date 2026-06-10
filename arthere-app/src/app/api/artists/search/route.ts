import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchArtists, type ArtistSearchCandidate, type ArtistSearchResult } from "@/lib/claude";

// Natural-language search over an artist directory (optionally scoped to one
// city). Returns matching artist slugs ranked by relevance, plus a short
// explanation of how the query was interpreted.
//
//   GET /api/artists/search?q=...&city=portland
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const citySlug = req.nextUrl.searchParams.get("city") ?? undefined;

  if (query.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const artists = await prisma.artist.findMany({
    where: citySlug ? { city: { slug: citySlug } } : undefined,
    include: {
      placeRelations: { include: { place: true } },
      artworkImages: { select: { aiTags: true } },
    },
  });

  const candidates: ArtistSearchCandidate[] = artists.map((a) => ({
    slug: a.slug,
    name: a.name,
    medium: a.medium,
    neighborhood: a.neighborhood,
    bio: a.bio,
    hireFor: a.hireFor,
    hireTags: a.hireTags,
    commissionStatus: a.commissionStatus,
    places: a.placeRelations.map((r) => ({ name: r.place.name, neighborhood: r.place.neighborhood })),
    artworkTags: a.artworkImages.map((img) => img.aiTags).filter((t) => t != null),
  }));

  let result: ArtistSearchResult;
  try {
    result = await searchArtists(query, candidates);
  } catch (err) {
    console.error("searchArtists failed, falling back to plain text match:", err);
    // Fallback: simple case-insensitive match against name/medium/neighborhood/bio.
    const needle = query.toLowerCase();
    result = {
      matches: candidates
        .filter((a) =>
          [a.name, a.medium, a.neighborhood, a.bio]
            .filter(Boolean)
            .some((field) => field!.toLowerCase().includes(needle))
        )
        .map((a) => ({ slug: a.slug, score: 100, reason: "Text match" })),
      explanation: "Search is running in basic mode right now, so this just matches on name, medium, neighborhood, and bio text.",
    };
  }

  return NextResponse.json(result);
}
