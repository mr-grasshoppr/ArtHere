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

  const responses = await prisma.surveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "id", "createdAt", "email", "raffleOptIn",
    "artistStatus", "artistStatusOther",
    "zipCode", "neighborhoods",
    "portlandFamiliarity", "portlandWords", "portlandHelpers", "portlandWish",
    "mvFamiliarity", "mvWords", "mvHelpers",
    "multnomahDaysInvolvement",
    "practiceActivities", "practiceGoals", "practiceGoalsOther", "practiceSupport",
    "featuredArtistInterest", "stayConnected",
  ];

  const lines = [
    headers.join(","),
    ...responses.map((r) =>
      row([
        r.id,
        r.createdAt.toISOString(),
        r.email,
        r.raffleOptIn,
        r.artistStatus,
        r.artistStatusOther,
        r.zipCode,
        r.neighborhoods,
        r.portlandFamiliarity,
        r.portlandWords.join("; "),
        r.portlandHelpers,
        r.portlandWish,
        r.mvFamiliarity,
        r.mvWords.join("; "),
        r.mvHelpers,
        r.multnomahDaysInvolvement.join("; "),
        r.practiceActivities.join("; "),
        r.practiceGoals.join("; "),
        r.practiceGoalsOther,
        r.practiceSupport,
        r.featuredArtistInterest,
        r.stayConnected.join("; "),
      ])
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="survey-responses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
