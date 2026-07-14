-- CreateEnum
CREATE TYPE "public"."TeenStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LEFT');

-- AlterTable
ALTER TABLE "public"."Activity" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Offering" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Teen" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateJoined" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "guardianPhone" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "school" TEXT,
ADD COLUMN     "status" "public"."TeenStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- Backfill dateJoined for existing teens from their createdAt (column stays nullable
-- for forward compatibility, but every existing row gets a sensible value).
UPDATE "public"."Teen" SET "dateJoined" = "createdAt" WHERE "dateJoined" IS NULL;
