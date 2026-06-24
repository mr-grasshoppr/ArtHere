-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portlandFamiliarity" TEXT,
    "portlandWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portlandHelpers" TEXT,
    "portlandWish" TEXT,
    "artistStatus" TEXT,
    "artistStatusOther" TEXT,
    "zipCode" TEXT,
    "neighborhoods" TEXT,
    "mvFamiliarity" TEXT,
    "mvWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mvHelpers" TEXT,
    "multnomahDaysInvolvement" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "practiceActivities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "practiceGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "practiceGoalsOther" TEXT,
    "practiceSupport" TEXT,
    "featuredArtistInterest" TEXT,
    "stayConnected" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "email" TEXT,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);
