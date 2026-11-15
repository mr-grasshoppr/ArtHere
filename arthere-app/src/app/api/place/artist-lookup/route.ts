import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { placeAccessWhere } from "@/lib/place-access";
import { rateLimit } from "@/lib/rate-limit";

// Type-ahead for a place picking an artist who is already on Art Here.
// Only signed-in place editors (and admins) can call it — it exposes names of
// artists across the site, so it isn't a public endpoint.
//
//   GET /api/place/artist-lookup?q=dar
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(req, "place-artist-lookup", { limit: 120, windowSeconds: 600 });
  if (limited) return limited;

  const isAdmin = isAdminEmail(session.user.email);
  if (!isAdmin) {
    const place = await prisma.place.findFirst({ where: placeAccessWhere(session.user.id), select: { id: true } });
    if (!place) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ artists: [] });

  const artists = await prisma.artist.findMany({
    where: {
      isArchived: false,
      isPlaceholder: false,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, slug: true, medium: true, neighborhood: true, bioPhotoUrl: true },
    orderBy: { name: "asc" },
    take: 8,
  });

  return NextResponse.json({ artists });
}
