-- The price range field is gone; a restaurant chooses which dietary attributes it offers.
-- Every existing restaurant starts with the whole vocabulary (the keys of DIETARY_OPTIONS in
-- lib/menu.ts) so nothing disappears from a menu until the restaurant narrows the list.
ALTER TABLE "Restaurant" DROP COLUMN "priceRange";
ALTER TABLE "Restaurant" ADD COLUMN "dietaryOptions" TEXT[] NOT NULL DEFAULT ARRAY['vegetarian', 'vegan', 'halal', 'gluten_free', 'spicy']::TEXT[];
