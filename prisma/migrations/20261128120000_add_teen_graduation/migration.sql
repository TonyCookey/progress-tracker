-- Additive only: new enum value + nullable columns. No existing data is touched.
ALTER TYPE "TeenStatus" ADD VALUE IF NOT EXISTS 'GRADUATED';

ALTER TABLE "Teen" ADD COLUMN "graduatedAt" TIMESTAMP(3),
ADD COLUMN "graduationNote" TEXT;

CREATE INDEX "Teen_status_graduatedAt_idx" ON "Teen"("status", "graduatedAt");
