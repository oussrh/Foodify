-- Kitchen tickets on paper (prisma/print.prisma): a restaurant's printers, the jobs each one owes,
-- and when a ticket prints (on arrival, the default, or on accept). Additive only: no restaurant
-- has a printer until its owner adds one, so nothing prints until then.

-- CreateEnum
CREATE TYPE "PrintTrigger" AS ENUM ('ARRIVAL', 'ACCEPT');

-- CreateEnum
CREATE TYPE "PrintJobKind" AS ENUM ('TICKET', 'CANCEL', 'TEST');

-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('PENDING', 'SENT', 'PRINTED', 'FAILED');

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "printTrigger" "PrintTrigger" NOT NULL DEFAULT 'ARRIVAL';

-- CreateTable
CREATE TABLE "Printer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintJob" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "printerId" TEXT NOT NULL,
    "orderId" TEXT,
    "changeId" TEXT,
    "kind" "PrintJobKind" NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "printedAt" TIMESTAMP(3),
    "lastAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Printer_tokenHash_key" ON "Printer"("tokenHash");

-- CreateIndex
CREATE INDEX "Printer_restaurantId_idx" ON "Printer"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintJob_seq_key" ON "PrintJob"("seq");

-- CreateIndex
CREATE INDEX "PrintJob_printerId_status_seq_idx" ON "PrintJob"("printerId", "status", "seq");

-- CreateIndex
CREATE INDEX "PrintJob_orderId_idx" ON "PrintJob"("orderId");

-- AddForeignKey
ALTER TABLE "Printer" ADD CONSTRAINT "Printer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "OrderChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

