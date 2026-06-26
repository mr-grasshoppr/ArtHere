-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "portlandSupport" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "portlandSupportOther" TEXT;
