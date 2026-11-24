-- Additive: first-time visitors register
CREATE TABLE "FirstTimer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "school" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "baseId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "invitedBy" TEXT,
    "howHeard" TEXT,
    "followedUp" BOOLEAN NOT NULL DEFAULT false,
    "returned" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FirstTimer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FirstTimer_baseId_idx" ON "FirstTimer"("baseId");
CREATE INDEX "FirstTimer_visitDate_idx" ON "FirstTimer"("visitDate");

ALTER TABLE "FirstTimer" ADD CONSTRAINT "FirstTimer_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
