CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetId" TEXT,
    "path" TEXT NOT NULL,
    "source" TEXT,
    "meta" JSONB,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

CREATE INDEX "AnalyticsEvent_type_kind_createdAt_idx" ON "AnalyticsEvent"("type", "kind", "createdAt");

CREATE INDEX "AnalyticsEvent_kind_targetId_idx" ON "AnalyticsEvent"("kind", "targetId");
