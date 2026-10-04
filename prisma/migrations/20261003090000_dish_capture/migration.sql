-- Dishes filmed on a phone and turned into AR models by the capture engine (prisma/capture.prisma):
-- one row per attempt, with what it came to. Additive only: no dish has a capture until someone
-- films one, and nothing reads this table outside the dish's AR section.

-- CreateEnum
CREATE TYPE "CaptureStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'ACCEPTED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "CaptureBase" AS ENUM ('LOGO', 'NAME', 'PLAIN');

-- CreateTable
CREATE TABLE "CaptureJob" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "status" "CaptureStatus" NOT NULL DEFAULT 'UPLOADING',
    "stage" TEXT,
    "plateCm" DECIMAL(4,1) NOT NULL,
    "base" "CaptureBase" NOT NULL,
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "error" TEXT,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "CaptureJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaptureJob_dishId_createdAt_idx" ON "CaptureJob"("dishId", "createdAt");

-- CreateIndex
CREATE INDEX "CaptureJob_restaurantId_createdAt_idx" ON "CaptureJob"("restaurantId", "createdAt");

-- AddForeignKey
ALTER TABLE "CaptureJob" ADD CONSTRAINT "CaptureJob_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureJob" ADD CONSTRAINT "CaptureJob_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

