import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  try {
    const { readFileSync } = await import("fs");
    const url = readFileSync("/tmp/arthere-dev-link.txt", "utf8").trim();
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}
