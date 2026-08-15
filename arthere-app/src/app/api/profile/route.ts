import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaceRelationship, LinkType } from "@prisma/client";
import { parseHireText } from "@/lib/claude";
import { profileSchema, parseBody } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import { snapshotArtist } from "@/lib/profile-revision";
import { normalizeNeighborhood } from "@/lib/neighborhoods";
import { parseMediumList } from "@/lib/artist-options";
import { registerMediumOptions } from "@/lib/medium-options";

// GET — fetch current user's artist profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    include: {
      artworkImages: { orderBy: { sortOrder: "asc" } },
      placeRelations: { include: { place: true } },
      otherConnections: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
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
    firstName,
    lastName,
    bio,
    quote,
    medium,
    neighborhood,
    hireFor,
    commissionStatus,
    priceRangeMin,
    priceRangeMax,
    sizeRangeMin,
    sizeRangeMax,
    // Place relations: [{ placeId, relationship }]
    placeRelations,
    // Affiliations outside the artist's local area: [{ name, relationship }]
    otherConnections,
    // Up to 3 links: [{ type, url, label }]
    links,
    // Intake
    intake,
  } = body;

  if (!firstName?.trim()) {
    return NextResponse.json({ error: "First name is required" }, { status: 400 });
  }

  // `name` stays the single field the rest of the app reads (display, slug,
  // search, CSV) — kept in sync from the structured firstName/lastName here.
  const name = [firstName.trim(), lastName?.trim()].filter(Boolean).join(" ");

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
    name,
    firstName: firstName.trim(),
    lastName: lastName?.trim() || null,
    bio: bio?.trim() || null,
    quote: quote?.trim() || null,
    medium: medium?.trim() || null,
    neighborhood: neighborhood?.trim() ? normalizeNeighborhood(neighborhood.trim()) : null,
    hireFor: hireForClean,
    // website/instagram are no longer written here — self-service now manages
    // ArtistLink instead (see below). Omitted, not nulled, so any historical
    // values are left alone.
    // commissionStatus/price/size range no longer have onboarding UI — only
    // touch them if a caller actually sends a value, so autosave (which now
    // never sends these) can't silently clobber previously-saved values.
    ...(commissionStatus !== undefined ? { commissionStatus: commissionStatus || "UNSPECIFIED" } : {}),
    ...(priceRangeMin !== undefined ? { priceRangeMin: num(priceRangeMin) } : {}),
    ...(priceRangeMax !== undefined ? { priceRangeMax: num(priceRangeMax) } : {}),
    ...(sizeRangeMin !== undefined ? { sizeRangeMin: num(sizeRangeMin) } : {}),
    ...(sizeRangeMax !== undefined ? { sizeRangeMax: num(sizeRangeMax) } : {}),
  };

  // Any medium the artist typed that isn't a known option yet (via the
  // free-text "Other" field) becomes a real, shared option going forward.
  if (artistData.medium) {
    await registerMediumOptions(parseMediumList(artistData.medium));
  }

  let artist;
  if (existing) {
    // isPlaceholder is deliberately left untouched here — autosave must never
    // flip a profile live. Only an admin publish (setArtistPlaceholder) or
    // the initial create below does that.
    artist = await prisma.artist.update({
      where: { id: existing.id },
      data: artistData,
    });
  } else {
    // A brand-new profile starts unpublished, pending admin review — see
    // "Submit for review" in OnboardingForm / api/profile/submit-for-review.
    // Without a cityId the artist never matches any city-scoped page's query
    // (see lib/city-scope.ts) — publishing it later would silently leave it
    // invisible on the artwork/artists/network pages despite being live.
    const portland = await prisma.city.findUnique({ where: { slug: "portland" } });
    try {
      artist = await prisma.artist.create({
        data: {
          ...artistData,
          isPlaceholder: true,
          cityId: portland?.id ?? null,
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
          isPlaceholder: true,
          cityId: portland?.id ?? null,
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

  // Update other connections — affiliations outside the artist's local area,
  // structured like placeRelations but never linked to an Art Here page.
  if (Array.isArray(otherConnections)) {
    await prisma.artistOtherConnection.deleteMany({ where: { artistId: artist.id } });
    const validConnections = (otherConnections as { name: string; relationship: string; relationshipLabel?: string | null }[])
      .filter((c) => c.name?.trim() && c.relationship);
    if (validConnections.length > 0) {
      await prisma.artistOtherConnection.createMany({
        data: validConnections.map((c, i) => ({
          artistId: artist.id,
          name: c.name.trim(),
          relationship: c.relationship as PlaceRelationship,
          relationshipLabel: c.relationshipLabel?.trim() || null,
          sortOrder: i,
        })),
      });
    }
  }

  // Update links — up to 3, each typed via the Links dropdown.
  if (Array.isArray(links)) {
    await prisma.artistLink.deleteMany({ where: { artistId: artist.id } });
    const validLinks = (links as { type: string; url: string; label?: string | null }[])
      .filter((l) => l.url?.trim() && l.type)
      .slice(0, 3);
    if (validLinks.length > 0) {
      await prisma.artistLink.createMany({
        data: validLinks.map((l, i) => ({
          artistId: artist.id,
          type: l.type as LinkType,
          url: l.url.trim(),
          label: l.label?.trim() || null,
          sortOrder: i,
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
