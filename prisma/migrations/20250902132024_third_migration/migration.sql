-- AlterTable
ALTER TABLE "public"."Activity" ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';
