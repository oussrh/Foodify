-- How a dish was filmed (prisma/capture.prisma): the phone walked round a still plate, or the plate
-- turned in front of a still phone. Additive: every capture so far was walked round.

-- CreateEnum
CREATE TYPE "CaptureMode" AS ENUM ('WALKAROUND', 'TURNTABLE');

-- AlterTable
ALTER TABLE "CaptureJob" ADD COLUMN "mode" "CaptureMode" NOT NULL DEFAULT 'WALKAROUND';
