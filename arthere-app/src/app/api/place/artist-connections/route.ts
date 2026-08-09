import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    include: { place: { select: { userId: true } } },
  });

  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (connection.place?.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.artistPlace.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
