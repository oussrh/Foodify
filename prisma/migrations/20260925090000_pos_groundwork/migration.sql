-- A restaurant's point of sale (prisma/pos.prisma): the super admin's switch per restaurant,
-- the connection with its encrypted credentials, which POS item each dish is, the outbox of
-- tickets, changes and closes owed to the POS and the inbox of what it told us; the POS's id
-- for a ticket, and who made a change (staff, or the POS closing a bill at the till). Additive
-- only: every restaurant starts with POS off, every existing change is the staff's.

-- CreateEnum
CREATE TYPE "PosStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTING', 'MAPPING', 'ACTIVE', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "PosOutboxKind" AS ENUM ('TICKET', 'CHANGE', 'CLOSE');

-- CreateEnum
CREATE TYPE "PosOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'REFUSED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "ChangeSource" AS ENUM ('STAFF', 'POS');

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "posEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "posCheckId" TEXT,
ADD COLUMN     "posPaidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderChange" ADD COLUMN     "source" "ChangeSource" NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE "PosConnection" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "PosStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "externalAccountId" TEXT,
    "externalLocationId" TEXT,
    "externalLocationName" TEXT,
    "credentials" TEXT,
    "credentialsKeyId" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosItemMap" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "externalItemId" TEXT NOT NULL,
    "externalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosItemMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosOutbox" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "connectionId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "changeId" TEXT,
    "kind" "PosOutboxKind" NOT NULL,
    "status" "PosOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAnswer" TEXT,
    "externalId" TEXT,
    "claimToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "PosOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosInbox" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "PosInbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosConnection_restaurantId_key" ON "PosConnection"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "PosItemMap_connectionId_dishId_key" ON "PosItemMap"("connectionId", "dishId");

-- CreateIndex
CREATE UNIQUE INDEX "PosOutbox_seq_key" ON "PosOutbox"("seq");

-- CreateIndex
CREATE INDEX "PosOutbox_status_nextAttemptAt_idx" ON "PosOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "PosOutbox_orderId_idx" ON "PosOutbox"("orderId");

-- CreateIndex
CREATE INDEX "PosOutbox_billId_idx" ON "PosOutbox"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "PosInbox_connectionId_externalEventId_key" ON "PosInbox"("connectionId", "externalEventId");

-- CreateIndex
CREATE INDEX "Order_restaurantId_posCheckId_idx" ON "Order"("restaurantId", "posCheckId");

-- AddForeignKey
ALTER TABLE "PosConnection" ADD CONSTRAINT "PosConnection_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosItemMap" ADD CONSTRAINT "PosItemMap_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PosConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosItemMap" ADD CONSTRAINT "PosItemMap_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOutbox" ADD CONSTRAINT "PosOutbox_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PosConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOutbox" ADD CONSTRAINT "PosOutbox_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOutbox" ADD CONSTRAINT "PosOutbox_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOutbox" ADD CONSTRAINT "PosOutbox_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "OrderChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosInbox" ADD CONSTRAINT "PosInbox_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PosConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

