-- Sold out for the rest of the service. The dish stays on the menu and stays `isActive`; it is
-- simply not orderable until this moment passes, which is what makes it expire without a job to
-- run. Null is available, which is what every existing dish is.
ALTER TABLE "Dish" ADD COLUMN "soldOutUntil" TIMESTAMP(3);
