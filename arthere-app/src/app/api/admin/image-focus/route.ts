import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";

// Admin manual framing override — sets manual=true so auto-detection never
// overwrites it. GET returns the current value (or null) for a given url;
// POST upserts a new one.

export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  const focus = await prisma.imageFocus.findUnique({ where: { url }, select: { x: true, y: true, scale: true } });
  return NextResponse.json({ focus });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { url, x, y, scale } = body ?? {};
  if (
    typeof url !== "string" ||
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof scale !== "number"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const data = { x: clamp(x, 0, 100), y: clamp(y, 0, 100), scale: clamp(scale, 1, 3), manual: true };

  await prisma.imageFocus.upsert({
    where: { url },
    create: { url, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
