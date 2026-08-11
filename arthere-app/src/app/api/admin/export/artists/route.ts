import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { row, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artists = await prisma.artist.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, emailVerified: true } },
      artworkImages: { select: { id: true } },
      adminNotes: { select: { body: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });

  const headers = [
    "id", "name", "firstName", "lastName", "slug", "email", "emailVerified",
    "medium", "neighborhood", "website", "instagram",
    "commissionStatus", "priceRangeMin", "priceRangeMax",
    "sizeRangeMin", "sizeRangeMax",
    "imageCount", "createdAt",
    "notes",
  ];

  const lines = [
    headers.join(","),
    ...artists.map((a) =>
      row([
        a.id,
        a.name,
        a.firstName,
        a.lastName,
        a.slug,
        a.user?.email ?? null,
        a.user?.emailVerified?.toISOString() ?? null,
        a.medium,
        a.neighborhood,
        a.website,
        a.instagram,
        a.commissionStatus,
        a.priceRangeMin != null ? String(a.priceRangeMin) : null,
        a.priceRangeMax != null ? String(a.priceRangeMax) : null,
        a.sizeRangeMin != null ? String(a.sizeRangeMin) : null,
        a.sizeRangeMax != null ? String(a.sizeRangeMax) : null,
        String(a.artworkImages.length),
        a.createdAt.toISOString(),
        a.adminNotes.map((n) => `[${n.createdAt.toISOString().slice(0, 10)}] ${n.body}`).join(" | "),
      ])
    ),
  ];

  return csvResponse(lines, "artists");
}
