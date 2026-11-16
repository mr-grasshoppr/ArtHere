-- Tag each survey response with the edition of the survey it answered.
-- Every existing row is the original PDX Community Survey.
ALTER TABLE "SurveyResponse" ADD COLUMN "surveyEdition" TEXT NOT NULL DEFAULT 'pdx-2026';
CREATE INDEX "SurveyResponse_surveyEdition_idx" ON "SurveyResponse"("surveyEdition");
