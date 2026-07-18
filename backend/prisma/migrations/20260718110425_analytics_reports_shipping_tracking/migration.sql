-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('produit', 'utilisateur', 'message');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('en_attente', 'traite', 'rejete');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'en_attente',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "city" TEXT,
    "ipHash" TEXT,
    "referrer" TEXT,
    "entryPath" TEXT,
    "exitPath" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "isReturning" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT,
    "targetId" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_visitorId_idx" ON "AnalyticsSession"("visitorId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_userId_idx" ON "AnalyticsSession"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_startedAt_idx" ON "AnalyticsSession"("startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_path_idx" ON "AnalyticsEvent"("path");

-- CreateIndex
CREATE INDEX "Order_vendorId_idx" ON "Order"("vendorId");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
