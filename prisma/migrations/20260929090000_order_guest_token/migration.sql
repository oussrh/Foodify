-- The guest's order-tracking link: the SHA-256 of the secret POST /api/orders hands back once to
-- a guest (server/secret.ts), looked up by GET /api/orders/track/<secret>. Additive: null on
-- every existing order and on every staff order, which have no link.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "guestTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_guestTokenHash_key" ON "Order"("guestTokenHash");
