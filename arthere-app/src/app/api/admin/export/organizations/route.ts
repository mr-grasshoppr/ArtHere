import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { row, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const places = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      _count: { select: { artists: true } },
      adminNotes: { where: { placeId: { not: null } }, select: { body: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });

  const headers = [
    "id", "name", "slug", "ownerEmail", "neighborhood", "website",
    "inDirectory", "artistCount", "createdAt", "notes",
  ];

  const lines = [
    headers.join(","),
    ...places.map((p) =>
      row([
        p.id,
        p.name,
        p.slug,
        p.user?.email ?? null,
        p.neighborhood,
        p.website,
        String(p.inDirectory),
        String(p._count.artists),
        p.createdAt.toISOString(),
        p.adminNotes.map((n) => `[${n.createdAt.toISOString().slice(0, 10)}] ${n.body}`).join(" | "),
      ])
    ),
  ];

  return csvResponse(lines, "organizations");
}
