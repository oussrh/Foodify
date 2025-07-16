/*
  Warnings:

  - You are about to drop the `_RestaurantToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_RestaurantToUser" DROP CONSTRAINT "_RestaurantToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_RestaurantToUser" DROP CONSTRAINT "_RestaurantToUser_B_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "restaurantId" TEXT;

-- DropTable
DROP TABLE "_RestaurantToUser";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
