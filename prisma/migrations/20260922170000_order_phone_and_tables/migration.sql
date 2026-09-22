-- The phone the order confirmation goes to (required from now on), and how many per-table QR
-- codes the Tables tab prints. Orders taken before this column have no number to carry, so the
-- column lands with an empty default that is then dropped: new orders must give one.
ALTER TABLE "Order" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ALTER COLUMN "phone" DROP DEFAULT;

ALTER TABLE "Restaurant" ADD COLUMN "tableCount" INTEGER NOT NULL DEFAULT 0;
