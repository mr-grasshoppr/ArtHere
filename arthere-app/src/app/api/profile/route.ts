import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaceRelationship } from "@prisma/client";
import { parseHireText } from "@/lib/claude";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

  const body = await req.json();
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

  const artistData = {
    name: name.trim(),
    bio: bio?.trim() || null,
    medium: medium?.trim() || null,
    neighborhood: neighborhood?.trim() || null,
    hireFor: hireForClean,
    website: website?.trim() || null,
    instagram: instagram?.trim().replace(/^@/, "") || null,
    commissionStatus: commissionStatus || "UNSPECIFIED",
    priceRangeMin: priceRangeMin ? Number(priceRangeMin) : null,
    priceRangeMax: priceRangeMax ? Number(priceRangeMax) : null,
    sizeRangeMin: sizeRangeMin ? Number(sizeRangeMin) : null,
    sizeRangeMax: sizeRangeMax ? Number(sizeRangeMax) : null,
  };

  let artist;
  if (existing) {
    artist = await prisma.artist.update({
      where: { id: existing.id },
      data: artistData,
    });
  } else {
    artist = await prisma.artist.create({
      data: {
        ...artistData,
        slug,
        userId: session.user.id,
      },
    });
  }

  // Update place relations
  if (Array.isArray(placeRelations)) {
    await prisma.artistPlace.deleteMany({ where: { artistId: artist.id } });

    const resolved: { placeId: string; relationship: PlaceRelationship }[] = [];
    for (const r of placeRelations as { placeId?: string; placeName?: string; relationship: string }[]) {
      if (!r.relationship) continue;

      let placeId = r.placeId;
      if (!placeId) {
        const name = r.placeName?.trim();
        if (!name) continue;

        const existingPlace = await prisma.place.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
        });

        if (existingPlace) {
          placeId = existingPlace.id;
        } else {
          const baseSlug = slugify(name);
          let placeSlug = baseSlug;
          let j = 1;
          while (await prisma.place.findUnique({ where: { slug: placeSlug } })) {
            placeSlug = `${baseSlug}-${j++}`;
          }
          const newPlace = await prisma.place.create({
            data: { name, slug: placeSlug, inDirectory: false },
          });
          placeId = newPlace.id;
        }
      }

      resolved.push({ placeId, relationship: r.relationship as PlaceRelationship });
    }

    // Drop duplicate (placeId, relationship) pairs — the table has a unique
    // constraint on that combination.
    const seen = new Set<string>();
    const deduped = resolved.filter((r) => {
      const key = `${r.placeId}:${r.relationship}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length > 0) {
      await prisma.artistPlace.createMany({
        data: deduped.map((r) => ({
          artistId: artist.id,
          placeId: r.placeId,
          relationship: r.relationship,
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
        turnaroundWeeks: intake.turnaroundWeeks ? Number(intake.turnaroundWeeks) : null,
        shipsInternationally: intake.shipsInternationally ?? false,
        worksInPerson: intake.worksInPerson ?? false,
        notes: intake.notes?.trim() || null,
      },
      update: {
        commissionTypes: intake.commissionTypes ?? [],
        turnaroundWeeks: intake.turnaroundWeeks ? Number(intake.turnaroundWeeks) : null,
        shipsInternationally: intake.shipsInternationally ?? false,
        worksInPerson: intake.worksInPerson ?? false,
        notes: intake.notes?.trim() || null,
      },
    });
  }

  // Fire-and-forget: parse hireFor text into structured tags if present
  if (hireForClean) {
    const artistId = artist.id;
    parseHireText(hireForClean)
      .then((tags) =>
        prisma.artist.update({ where: { id: artistId }, data: { hireTags: tags } })
      )
      .catch(() => {
        // Non-critical — tags will populate on next save
      });
  }

  // Never expose hireTags to the client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hireTags: _omitted, ...safeArtist } = artist as typeof artist & { hireTags?: unknown };
  return NextResponse.json({ artist: safeArtist });
}
