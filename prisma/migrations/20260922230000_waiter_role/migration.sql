-- A waiter takes an order at the table for a guest who would rather not use their own phone.
-- They place orders and read the board; the kitchen alone moves an order along. An order taken
-- this way records who took it and carries no phone, because there is nobody to text.
ALTER TYPE "UserRole" ADD VALUE 'WAITER';
