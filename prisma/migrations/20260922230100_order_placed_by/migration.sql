-- Who took the order, when it was not the guest themselves. Null for every order placed from a
-- guest's own phone, which is all of them until a waiter signs in.
ALTER TABLE "Order" ADD COLUMN "placedById" TEXT;
ALTER TABLE "Order" ADD CONSTRAINT "Order_placedById_fkey" FOREIGN KEY ("placedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
