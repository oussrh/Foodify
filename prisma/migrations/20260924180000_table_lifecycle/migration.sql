-- The table's bill, from the first ticket to the bill being paid: a bill is closed (by whom and
-- when), a dish is taken off a ticket without deleting its line (`removedQuantity`), and every
-- change to a sent order is one row of `OrderChange`, applied at once or pending the kitchen's
-- answer. Additive only: every existing order stays open, every line keeps its whole quantity.
CREATE TYPE "OrderChangeKind" AS ENUM ('CANCEL', 'REMOVE', 'VOID', 'CLOSE', 'MERGE', 'UNMERGE', 'MOVE');

CREATE TYPE "OrderChangeStatus" AS ENUM ('APPLIED', 'PENDING', 'REFUSED');

CREATE TYPE "OrderChangeReason" AS ENUM ('changed_mind', 'mistake', 'too_slow', 'unavailable', 'other');

ALTER TABLE "Order" ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "closedById" TEXT;

ALTER TABLE "OrderLine" ADD COLUMN "removedQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "OrderChange" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lineId" TEXT,
    "kind" "OrderChangeKind" NOT NULL,
    "quantity" INTEGER,
    "reason" "OrderChangeReason",
    "note" TEXT,
    "fromTable" TEXT,
    "toTable" TEXT,
    "mergedOrderId" TEXT,
    "status" "OrderChangeStatus" NOT NULL,
    "requestedById" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderChange_orderId_idx" ON "OrderChange"("orderId");

CREATE INDEX "OrderChange_restaurantId_createdAt_idx" ON "OrderChange"("restaurantId", "createdAt");

ALTER TABLE "Order" ADD CONSTRAINT "Order_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderChange" ADD CONSTRAINT "OrderChange_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderChange" ADD CONSTRAINT "OrderChange_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderChange" ADD CONSTRAINT "OrderChange_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderChange" ADD CONSTRAINT "OrderChange_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderChange" ADD CONSTRAINT "OrderChange_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
