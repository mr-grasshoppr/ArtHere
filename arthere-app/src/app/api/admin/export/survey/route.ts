import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { row, csvResponse } from "@/lib/csv";
import {
  INVOLVEMENT_NEWS,
  INVOLVEMENT_FEATURED,
  INVOLVEMENT_VOLUNTEER,
  INVOLVEMENT_PARADE,
  INVOLVEMENT_PARTNER,
  INVOLVEMENT_OTHER,
  INVOLVEMENT_NONE,
} from "@/lib/survey-constants";

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin-flagged test responses are excluded to match what the dashboard
  // reports. ?includeTests=1 exports everything, with an isTest column so the
  // test rows stay identifiable in the spreadsheet.
  const includeTests = new URL(request.url).searchParams.get("includeTests") === "1";

  const responses = await prisma.surveyResponse.findMany({
    where: includeTests ? undefined : { isTest: false },
    orderBy: { createdAt: "desc" },
  });

  const flag = (arr: string[], value: string) => arr.includes(value) ? "Yes" : "";

  const headers = [
    "id", "createdAt", "completedAt", "source", "email", "raffleOptIn",
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
    "learnedAbout", "connectionSuggestions", "openFeedback",
    ...(includeTests ? ["isTest"] : []),
  ];

  const lines = [
    headers.join(","),
    ...responses.map((r) =>
      row([
        r.id,
        r.createdAt.toISOString(),
        r.completedAt?.toISOString() ?? "",
        r.source,
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
        flag(r.involvementInterests, INVOLVEMENT_NEWS),
        flag(r.involvementInterests, INVOLVEMENT_FEATURED),
        flag(r.involvementInterests, INVOLVEMENT_VOLUNTEER),
        flag(r.involvementInterests, INVOLVEMENT_PARADE),
        flag(r.involvementInterests, INVOLVEMENT_PARTNER),
        flag(r.involvementInterests, INVOLVEMENT_OTHER),
        r.involvementInterestsOther,
        flag(r.involvementInterests, INVOLVEMENT_NONE),
        r.learnedAbout.join("; "),
        r.connectionSuggestions,
        r.openFeedback,
        ...(includeTests ? [r.isTest ? "Yes" : ""] : []),
      ])
    ),
  ];

  return csvResponse(lines, "survey-responses");
}
