import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { row, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const responses = await prisma.surveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  const flag = (arr: string[], value: string) => arr.includes(value) ? "Yes" : "";

  const headers = [
    "id", "createdAt", "email", "raffleOptIn",
    "zipCode", "neighborhoods",
    "occupation", "occupationOther",
    "artistStatus", "artistStatusOther",
    "artMedium", "artMediumOther",
    "portlandFamiliarity",
    "discoveryEase", "discoveryChannel", "discoveryChannelOther",
    "portlandHelpers", "portlandSupport", "portlandSupportOther",
    "careerStage", "careerStageOther",
    "practiceActivities", "practiceActivitiesOther",
    "practiceGoals", "practiceGoalsOther", "practiceSupport",
    "involvement_newsUpdates", "involvement_featuredArtist", "involvement_volunteer",
    "involvement_joinParade", "involvement_partner", "involvement_other", "involvement_otherText",
    "involvement_none",
    "learnedAbout", "openFeedback",
  ];

  const lines = [
    headers.join(","),
    ...responses.map((r) =>
      row([
        r.id,
        r.createdAt.toISOString(),
        r.email,
        r.raffleOptIn,
        r.zipCode,
        r.neighborhoods,
        r.occupation.join("; "),
        r.occupationOther,
        r.artistStatus,
        r.artistStatusOther,
        r.artMedium.join("; "),
        r.artMediumOther,
        r.portlandFamiliarity,
        r.discoveryEase,
        r.discoveryChannel.join("; "),
        r.discoveryChannelOther,
        r.portlandHelpers,
        r.portlandSupport.join("; "),
        r.portlandSupportOther,
        r.careerStage,
        r.careerStageOther,
        r.practiceActivities.join("; "),
        r.practiceActivitiesOther,
        r.practiceGoals.join("; "),
        r.practiceGoalsOther,
        r.practiceSupport,
        flag(r.involvementInterests, "Keep me posted on Art Here news"),
        flag(r.involvementInterests, "Showcase my work on the Art Here platform"),
        flag(r.involvementInterests, "Volunteer to help Art Here"),
        flag(r.involvementInterests, "Join the parade at Multnomah Days 2026 (August 15, Portland)"),
        flag(r.involvementInterests, "Partner or collaborate"),
        flag(r.involvementInterests, "Other"),
        r.involvementInterestsOther,
        flag(r.involvementInterests, "None of the above"),
        r.learnedAbout.join("; "),
        r.openFeedback,
      ])
    ),
  ];

  return csvResponse(lines, "survey-responses");
}
