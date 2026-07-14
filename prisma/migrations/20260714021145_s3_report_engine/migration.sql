-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('DRAFT', 'FINAL');

-- AlterTable
ALTER TABLE "public"."Base" ADD COLUMN     "label" TEXT;

-- CreateTable
CREATE TABLE "public"."NewConvert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "baseId" TEXT,
    "isCrossBase" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,
    "activityId" TEXT,
    "invitedBy" TEXT,
    "followedUp" BOOLEAN NOT NULL DEFAULT false,
    "becameTeen" BOOLEAN NOT NULL DEFAULT false,
    "teenId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NewConvert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MonthlyReport" (
    "id" TEXT NOT NULL,
    "baseId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "dataJson" JSONB,
    "fileKey" TEXT,
    "openingBalance" DECIMAL(12,2),
    "income" DECIMAL(12,2),
    "expenseItems" JSONB,
    "theme" TEXT,
    "executiveSummary" TEXT,
    "issues" TEXT,
    "alternativeChurches" TEXT,
    "sundayTeaching" TEXT,
    "description" TEXT,
    "victories" JSONB,
    "challenges" JSONB,
    "plans" JSONB,
    "updateOnTeens" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewConvert_baseId_idx" ON "public"."NewConvert"("baseId");

-- CreateIndex
CREATE INDEX "NewConvert_date_idx" ON "public"."NewConvert"("date");

-- CreateIndex
CREATE INDEX "MonthlyReport_baseId_idx" ON "public"."MonthlyReport"("baseId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_baseId_month_year_key" ON "public"."MonthlyReport"("baseId", "month", "year");

-- AddForeignKey
ALTER TABLE "public"."NewConvert" ADD CONSTRAINT "NewConvert_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "public"."Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MonthlyReport" ADD CONSTRAINT "MonthlyReport_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "public"."Base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill report location labels for the two existing bases
UPDATE "public"."Base" SET "label" = 'Mainland' WHERE "name" = 'Alpha' AND "label" IS NULL;
UPDATE "public"."Base" SET "label" = 'Island' WHERE "name" = 'Bravo' AND "label" IS NULL;
