-- AlterTable
ALTER TABLE "public"."Teen" ADD COLUMN     "householdId" TEXT;

-- CreateTable
CREATE TABLE "public"."Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "primaryContactName" TEXT,
    "primaryContactPhone" TEXT,
    "baseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Household_baseId_idx" ON "public"."Household"("baseId");

-- CreateIndex
CREATE INDEX "Teen_householdId_idx" ON "public"."Teen"("householdId");

-- AddForeignKey
ALTER TABLE "public"."Teen" ADD CONSTRAINT "Teen_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "public"."Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Household" ADD CONSTRAINT "Household_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "public"."Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;
