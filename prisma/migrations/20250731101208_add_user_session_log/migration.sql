-- CreateTable
CREATE TABLE "UserSessionLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "device" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSessionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSessionLog" ADD CONSTRAINT "UserSessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
