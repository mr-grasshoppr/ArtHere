import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaceRelationship } from "@prisma/client";
import { parseHireText } from "@/lib/claude";
import { profileSchema, parseBody } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import { snapshotArtist } from "@/lib/profile-revision";
import { normalizeNeighborhood } from "@/lib/neighborhoods";

// GET — fetch current user's artist profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    include: {
      artworkImages: { orderBy: { sortOrder: "asc" } },
      placeRelations: { include: { place: true } },
      intake: true,
    },
  });

  return NextResponse.json({ artist });
}

// POST — create or update artist profile
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const body = parseBody(profileSchema, raw);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const {
    name,
    bio,
    medium,
    neighborhood,
    hireFor,
    website,
    instagram,
    commissionStatus,
    priceRangeMin,
    priceRangeMax,
    sizeRangeMin,
    sizeRangeMax,
    // Place relations: [{ placeId, relationship }]
    placeRelations,
    // Intake
    intake,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate a unique slug
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;

  const existing = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });

  if (!existing) {
    // Creating — check slug uniqueness
    while (await prisma.artist.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }
  } else {
    slug = existing.slug; // keep existing slug on update
  }

  const hireForClean = hireFor?.trim() || null;

  // Coerce numeric fields defensively — inputs arrive as strings and a
  // non-numeric value would otherwise become NaN and crash the Prisma write.
  const num = (v: unknown): number | null => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const artistData = {
    name: name.trim(),
    bio: bio?.trim() || null,
    medium: medium?.trim() || null,
    neighborhood: neighborhood?.trim() ? normalizeNeighborhood(neighborhood.trim()) : null,
    hireFor: hireForClean,
    website: website?.trim() || null,
    instagram: instagram?.trim().replace(/^@/, "") || null,
    commissionStatus: commissionStatus || "UNSPECIFIED",
    priceRangeMin: num(priceRangeMin),
    priceRangeMax: num(priceRangeMax),
    sizeRangeMin: num(sizeRangeMin),
    sizeRangeMax: num(sizeRangeMax),
    isPlaceholder: false,
  };

  let artist;
  if (existing) {
    artist = await prisma.artist.update({
      where: { id: existing.id },
      data: artistData,
    });
  } else {
    try {
      artist = await prisma.artist.create({
        data: {
          ...artistData,
          slug,
          userId: session.user.id,
        },
      });
    } catch {
      // A concurrent request can claim the slug between our uniqueness check
      // and the insert — retry once with a random suffix instead of a 500.
      artist = await prisma.artist.create({
        data: {
          ...artistData,
          slug: `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`,
          userId: session.user.id,
        },
      });
    }
  }

  // Update place relations. Artists never create Place records here: a venue
  // links internally only if it already has a page (matched by id or exact
  // name); otherwise it's stored as free-text venueName and rendered without a
  // link. Near-but-inexact name matches are disambiguated on the client (the
  // venue field offers existing venues as you type) before we ever get here.
  if (Array.isArray(placeRelations)) {
    await prisma.artistPlace.deleteMany({ where: { artistId: artist.id } });

    type Resolved = {
      placeId: string | null;
      venueName: string | null;
      relationship: PlaceRelationship;
      relationshipLabel: string | null;
    };
    const resolved: Resolved[] = [];
    for (const r of placeRelations as { placeId?: string; placeName?: string; relationship: string; relationshipLabel?: string | null }[]) {
      if (!r.relationship) continue;
      const relationship = r.relationship as PlaceRelationship;
      const relationshipLabel = r.relationshipLabel ?? null;

      // Explicit pick from the venue typeahead — link to that page.
      if (r.placeId) {
        resolved.push({ placeId: r.placeId, venueName: null, relationship, relationshipLabel });
        continue;
      }

      const name = r.placeName?.trim();
      if (!name) continue;

      // Exact (case-insensitive) match to an existing page links internally;
      // anything else is kept as a plain name, never a new Place.
      const existingPlace = await prisma.place.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true },
      });

      resolved.push(
        existingPlace
          ? { placeId: existingPlace.id, venueName: null, relationship, relationshipLabel }
          : { placeId: null, venueName: name, relationship, relationshipLabel },
      );
    }

    // Drop duplicates. Real places are unique-constrained on
    // (artist, place, relationship); name-only rows dedupe on the name.
    const seen = new Set<string>();
    const deduped = resolved.filter((r) => {
      const key = `${r.placeId ?? r.venueName?.toLowerCase()}:${r.relationship}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length > 0) {
      await prisma.artistPlace.createMany({
        data: deduped.map((r) => ({
          artistId: artist.id,
          placeId: r.placeId,
          venueName: r.venueName,
          relationship: r.relationship,
          relationshipLabel: r.relationshipLabel,
        })),
      });
    }
  }

  // Update intake
  if (intake != null) {
    await prisma.artistIntake.upsert({
      where: { artistId: artist.id },
      create: {
        artistId: artist.id,
        commissionTypes: intake.commissionTypes ?? [],
        turnaroundWeeks: num(intake.turnaroundWeeks),
        shipsInternationally: intake.shipsInternationally ?? false,
        worksInPerson: intake.worksInPerson ?? false,
        notes: intake.notes?.trim() || null,
      },
      update: {
        commissionTypes: intake.commissionTypes ?? [],
        turnaroundWeeks: num(intake.turnaroundWeeks),
        shipsInternationally: intake.shipsInternationally ?? false,
        worksInPerson: intake.worksInPerson ?? false,
        notes: intake.notes?.trim() || null,
      },
    });
  }

  // Record an append-only revision snapshot of the just-saved profile.
  await snapshotArtist(artist.id, "artist", session.user.email);

  // Parse hireFor text into structured tags after the response is sent.
  // waitUntil keeps the function alive; a bare promise would be frozen.
  if (hireForClean) {
    const artistId = artist.id;
    waitUntil(
      parseHireText(hireForClean)
        .then((tags) =>
          prisma.artist.update({ where: { id: artistId }, data: { hireTags: tags as object } })
        )
        .catch(() => {
          // Non-critical — tags will populate on next save
        })
    );
  }

  // Never expose hireTags to the client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hireTags: _omitted, ...safeArtist } = artist as typeof artist & { hireTags?: unknown };
  return NextResponse.json({ artist: safeArtist });
}
