-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachRecipient" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "OutreachRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachMessage_createdAt_idx" ON "OutreachMessage"("createdAt");

-- CreateIndex
CREATE INDEX "OutreachRecipient_messageId_idx" ON "OutreachRecipient"("messageId");

-- CreateIndex
CREATE INDEX "OutreachRecipient_email_idx" ON "OutreachRecipient"("email");

-- AddForeignKey
ALTER TABLE "OutreachRecipient" ADD CONSTRAINT "OutreachRecipient_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OutreachMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
