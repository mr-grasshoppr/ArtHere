import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { placeAccessWhere } from "@/lib/place-access";
import { PlaceRelationship } from "@prisma/client";
import { recordAffiliationEvents } from "@/lib/affiliation-history-server";

// A place connects an artist who already has an Art Here profile. Artists
// make these same connections from their own editor with no approval step, and
// the place can remove them — this mirrors that, from the place's side. The
// artist can remove it from their own profile too.
//
// Body: { artistId, relationship, relationshipLabel?, placeId? }
// placeId is only needed by admins; a place editor's page is looked up from
// their session.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const artistId = typeof body?.artistId === "string" ? body.artistId : "";
  const relationship = body?.relationship as PlaceRelationship;
  if (!artistId || !Object.values(PlaceRelationship).includes(relationship)) {
    return NextResponse.json({ error: "Missing artist or relationship" }, { status: 400 });
  }
  // A title ("Founder") is allowed for any relationship; "Other" requires one.
  const relationshipLabel = (typeof body?.relationshipLabel === "string" ? body.relationshipLabel.trim().slice(0, 100) : "") || null;
  if (relationship === "OTHER" && !relationshipLabel) {
    return NextResponse.json({ error: 'Add a short title for "Other", e.g. Residency alumni.' }, { status: 400 });
  }

  const isAdmin = isAdminEmail(session.user.email);
  const place = await prisma.place.findFirst({
    where: isAdmin && typeof body?.placeId === "string" ? { id: body.placeId } : placeAccessWhere(session.user.id),
    select: { id: true, name: true },
  });
  if (!place) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const artist = await prisma.artist.findFirst({
    where: { id: artistId, isArchived: false, isPlaceholder: false },
    select: { id: true, name: true, slug: true },
  });
  if (!artist) return NextResponse.json({ error: "That artist isn't on Art Here" }, { status: 404 });

  // An artist can hold several roles at one place (student, then member, then
  // instructor…), one row each. Only the same role twice is refused — change
  // its title instead.
  const existing = await prisma.artistPlace.findFirst({
    where: { artistId: artist.id, placeId: place.id, relationship },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `${artist.name} is already listed here with that role. Pick a different role, or use Edit title on the existing one.` },
      { status: 409 },
    );
  }

  // The artist may already have listed this place as plain text before it had
  // a page. Link that entry instead of adding a second one.
  const typed = await prisma.artistPlace.findFirst({
    where: { artistId: artist.id, placeId: null, venueName: { equals: place.name, mode: "insensitive" } },
    select: { id: true },
  });
  const connection = typed
    ? await prisma.artistPlace.update({ where: { id: typed.id }, data: { placeId: place.id, venueName: null } })
    : await prisma.artistPlace.create({ data: { artistId: artist.id, placeId: place.id, relationship, relationshipLabel } });

  await recordAffiliationEvents({ id: artist.id, name: artist.name }, isAdmin ? "ADMIN" : "PLACE", [
    {
      // Linking the artist's own typed entry is the place agreeing with it,
      // not a new affiliation; anything else is a new one.
      action: typed ? "CONFIRMED" : "ADDED",
      row: { placeId: place.id, venueName: null, relationship: connection.relationship, relationshipLabel: connection.relationshipLabel },
    },
  ]);

  // Drop a hand-typed copy of the same name — it's now a real connection.
  await prisma.placeListedArtist.deleteMany({ where: { placeId: place.id, name: { equals: artist.name, mode: "insensitive" } } });

  const photo = await prisma.artist.findUnique({ where: { id: artist.id }, select: { bioPhotoUrl: true, heroImageUrl: true } });
  return NextResponse.json({
    ok: true,
    connection: {
      photoUrl: photo?.bioPhotoUrl ?? photo?.heroImageUrl ?? null,
      connectionId: connection.id,
      slug: artist.slug,
      name: artist.name,
      relationship: connection.relationship,
      relationshipLabel: connection.relationshipLabel,
    },
  });
}

// Lets a place remove an artist's self-added connection to them (e.g. "Member",
// "Exhibiting Artist") — artists add these from their own profile editor with
// no approval step, so this is the place's only recourse if one is wrong.
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const connection = await prisma.artistPlace.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true } },
      place: {
        select: { userId: true, members: { where: { userId: session.user.id }, select: { id: true } } },
      },
    },
  });

  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const hasAccess =
    isAdminEmail(session.user.email) || connection.place?.userId === session.user.id || (connection.place?.members.length ?? 0) > 0;
  if (!hasAccess) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.artistPlace.delete({ where: { id } });
  // The row is gone, but we keep a permanent record that they were affiliated.
  await recordAffiliationEvents(connection.artist, isAdminEmail(session.user.email) ? "ADMIN" : "PLACE", [
    { action: "REMOVED", row: { placeId: connection.placeId, venueName: connection.venueName, relationship: connection.relationship, relationshipLabel: connection.relationshipLabel } },
  ]);

  return NextResponse.json({ ok: true });
}

// Change the title shown under an artist's name on the page (e.g. "Founder").
// The artist can change it too, from their own profile editor.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id || typeof body?.relationshipLabel !== "string") return NextResponse.json({ error: "Missing id or title" }, { status: 400 });
  const label = body.relationshipLabel.trim().slice(0, 100) || null;

  const connection = await prisma.artistPlace.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true } },
      place: { select: { userId: true, members: { where: { userId: session.user.id }, select: { id: true } } } },
    },
  });
  if (!connection?.place) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const hasAccess = isAdminEmail(session.user.email) || connection.place.userId === session.user.id || connection.place.members.length > 0;
  if (!hasAccess) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (connection.relationship === "OTHER" && !label) {
    return NextResponse.json({ error: 'A title is required for "Other".' }, { status: 400 });
  }

  await prisma.artistPlace.update({ where: { id }, data: { relationshipLabel: label } });
  await recordAffiliationEvents(connection.artist, isAdminEmail(session.user.email) ? "ADMIN" : "PLACE", [
    { action: "TITLE_CHANGED", row: { placeId: connection.placeId, venueName: null, relationship: connection.relationship, relationshipLabel: label } },
  ]);
  return NextResponse.json({ ok: true, relationshipLabel: label });
}
