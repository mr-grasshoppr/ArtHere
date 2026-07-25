import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/admin";

// Admin-only bare blob upload — returns a public URL without any DB writes.
// Used by the organization editor, whose images live as plain URLs on the Place
// (heroImageUrl / galleryImages) rather than as ArtworkImage rows.
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const prefix = (formData.get("prefix") as string | null) ?? "places";

  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20 MB)." }, { status: 400 });
  }

  const safePrefix = prefix.replace(/[^a-z0-9/-]/gi, "");
  const filename = `${safePrefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const blob = await put(filename, file, { access: "public", addRandomSuffix: false });

  return NextResponse.json({ url: blob.url });
}
