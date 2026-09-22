-- How a device account signs in. A person signs in with their address and has none; a tablet or a
-- waiter has no mailbox, so it is given a name instead. Unique where present, so a name answers
-- for at most one account.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
