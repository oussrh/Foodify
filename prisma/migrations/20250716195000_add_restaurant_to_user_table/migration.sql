-- Create join table for Restaurant and User
CREATE TABLE "_RestaurantToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_RestaurantToUser_AB_unique" ON "_RestaurantToUser"("A", "B");
CREATE INDEX "_RestaurantToUser_B_index" ON "_RestaurantToUser"("B");

-- Populate join table from existing restaurantId field if it exists
INSERT INTO "_RestaurantToUser" ("A", "B")
SELECT "restaurantId", "id" FROM "User" WHERE "restaurantId" IS NOT NULL;

-- Drop existing foreign key and column
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_restaurantId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "restaurantId";
ALTER TABLE "_RestaurantToUser" ADD CONSTRAINT "_RestaurantToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_RestaurantToUser" ADD CONSTRAINT "_RestaurantToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
