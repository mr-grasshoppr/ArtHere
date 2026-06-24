-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "learnedAbout" TEXT[] DEFAULT ARRAY[]::TEXT[];
