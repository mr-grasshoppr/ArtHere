import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSearchQuery, rankResultsWithClaude } from "@/lib/claude";
import type { ArtworkTags } from "@/lib/claude";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  // Step 1: Parse the natural language query into structured filters
  const intent = await parseSearchQuery(query);

  // Step 2: Fetch artwork images that have been AI-tagged
  const images = await prisma.artworkImage.findMany({
    where: {
      aiTags: { not: Prisma.JsonNull },
    },
    include: {
      artist: {
        include: { intake: true },
      },
    },
    take: 200,
  });

  // Step 3: Apply commission filter in-memory
  const candidates = images.filter((img) => {
    if (intent.filters.commissions_open === true) {
      return img.artist.commissionStatus === "OPEN";
    }
    return true;
  });

  // Step 4: Use Claude to rank the candidates
  const ranked = await rankResultsWithClaude(
    query,
    candidates.map((img) => ({
      artworkId: img.id,
      artistId: img.artistId,
      artistName: img.artist.name,
      imageUrl: img.url,
      aiTags: img.aiTags as ArtworkTags | null,
      intake: img.artist.intake as object | null,
    }))
  );

  // Step 5: Fetch artist details for top results
  const topArtistIds = [...new Set(ranked.slice(0, 20).map((r) => r.artistId))];
  const artists = await prisma.artist.findMany({
    where: { id: { in: topArtistIds } },
    include: {
      artworkImages: {
        where: { aiTags: { not: Prisma.JsonNull } },
        orderBy: { sortOrder: "asc" },
        take: 3,
      },
      placeRelations: {
        include: { place: true },
      },
    },
  });

  const artistMap = Object.fromEntries(artists.map((a) => [a.id, a]));

  const results = ranked
    .slice(0, 20)
    .filter((r) => r.score >= 30)
    .map((r) => ({
      score: r.score,
      reason: r.reason,
      artwork: candidates.find((c) => c.id === r.artworkId),
      artist: artistMap[r.artistId] ?? null,
    }))
    .filter((r) => r.artist != null);

  return NextResponse.json({ query, intent, results });
}
