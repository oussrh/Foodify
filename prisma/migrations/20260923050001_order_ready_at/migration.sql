-- When the kitchen called it up. Separate migration from the enum value: Postgres will not let a
-- value added to an enum be used in the same transaction that added it, and Prisma runs each
-- migration in one.
ALTER TABLE "Order" ADD COLUMN "readyAt" TIMESTAMP(3);
