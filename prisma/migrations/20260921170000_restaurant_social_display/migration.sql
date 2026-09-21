-- The menu footer can show the social links as icons (the default, unchanged) or as text labels.
ALTER TABLE "Restaurant" ADD COLUMN "socialDisplay" TEXT NOT NULL DEFAULT 'icons';
