-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "draftToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_draftToken_key" ON "SurveyResponse"("draftToken");

