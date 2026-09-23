-- A restaurant's own time zone (IANA). Existing restaurants take UTC, which is what the sold-out
-- return and the Insights report used before the setting existed, so nothing moves until a manager
-- picks their zone.
ALTER TABLE "Restaurant" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';
