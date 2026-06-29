-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "involvementInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "involvementInterestsOther" TEXT;
