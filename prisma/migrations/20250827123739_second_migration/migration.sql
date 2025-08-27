-- AlterTable
ALTER TABLE "public"."Activity" ADD COLUMN     "description" TEXT NOT NULL DEFAULT ' ',
ADD COLUMN     "number" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."_ActivityToGroup" ADD CONSTRAINT "_ActivityToGroup_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_ActivityToGroup_AB_unique";

-- CreateTable
CREATE TABLE "public"."Offering" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "isCrossBase" BOOLEAN NOT NULL DEFAULT false,
    "baseId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "service" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);
