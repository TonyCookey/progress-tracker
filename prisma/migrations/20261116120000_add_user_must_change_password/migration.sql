-- Additive: flags accounts that must set a new password at next sign-in
-- (admin-created accounts with a temporary password, admin-issued temp passwords).
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
