-- One bill per table visit: a waiter who adds dishes to a table that already ordered sends an
-- addition, its own order (own number, own way across the kitchen board) pointing at the order
-- that opened the bill. Additive only: every existing order keeps a null parent and opens its own.
ALTER TABLE "Order" ADD COLUMN "parentId" TEXT;

CREATE INDEX "Order_parentId_idx" ON "Order"("parentId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
