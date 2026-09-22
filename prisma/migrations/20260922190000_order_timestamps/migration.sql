-- When the kitchen took an order on and when it went out, so the history can measure the wait
-- before a start and the time to the table. Orders finished before this column existed have only
-- `updatedAt` to go on: a DONE one takes it as its served time, and none of them has a start.
ALTER TABLE "Order" ADD COLUMN "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "servedAt" TIMESTAMP(3);

UPDATE "Order" SET "servedAt" = "updatedAt" WHERE "status" = 'DONE';
