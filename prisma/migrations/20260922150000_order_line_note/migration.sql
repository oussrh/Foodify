-- What the guest asked for on one dish of the order ("no onions"), one note per dish line.
-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "note" TEXT;

