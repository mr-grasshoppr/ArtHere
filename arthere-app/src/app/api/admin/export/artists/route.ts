import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_EMAIL = "maryannamail@gmail.com";

function esc(v: string | null | undefined): string {
  if (v == null || v === "") return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(values: (string | null | undefined)[]): string {
  return values.map(esc).join(",");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
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
    "id", "name", "slug", "email", "emailVerified",
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
        a.slug,
        a.user.email,
        a.user.emailVerified?.toISOString() ?? null,
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

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="artists-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
