-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "ageRange" TEXT,
ADD COLUMN     "occupation" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "occupationOther" TEXT;
