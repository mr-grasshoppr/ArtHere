/*
  Warnings:

  - The `mvSupport` column on the `SurveyResponse` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "mvSupportOther" TEXT,
DROP COLUMN "mvSupport",
ADD COLUMN     "mvSupport" TEXT[] DEFAULT ARRAY[]::TEXT[];
