-- Add displayName for cross-platform user identity (hifamily SSO)
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
