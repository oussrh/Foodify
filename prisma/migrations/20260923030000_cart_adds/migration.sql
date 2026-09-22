-- A guest putting a dish in their order on the public menu. Nothing recorded this step before:
-- a cart lives in the guest's browser, and most carts are never sent, so the menu's funnel had
-- a hole between a dish being read and an order arriving.
CREATE TABLE "CartAdd" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartAdd_pkey" PRIMARY KEY ("id")
);

-- Every read of this table is "one restaurant, over a stretch of time".
CREATE INDEX "CartAdd_restaurantId_createdAt_idx" ON "CartAdd"("restaurantId", "createdAt");

ALTER TABLE "CartAdd" ADD CONSTRAINT "CartAdd_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartAdd" ADD CONSTRAINT "CartAdd_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The report reads dish views by restaurant and time too, and they are only reachable through
-- the dish; without this every bucket is a sequential scan of the whole view table.
CREATE INDEX IF NOT EXISTS "DishView_dishId_viewedAt_idx" ON "DishView"("dishId", "viewedAt");
