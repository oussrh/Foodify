-- The second factor is opt-in per account (Account settings, both portals): off, a password alone opens a session.
ALTER TABLE "User" ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
