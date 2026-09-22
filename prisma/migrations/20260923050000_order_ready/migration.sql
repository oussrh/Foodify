-- "Ready to be served": the food is up on the pass, the kitchen is finished and the floor has not
-- started. DONE used to carry both meanings, which is why a waiter had to be told about a served
-- order and guess it was still waiting to be carried.
ALTER TYPE "OrderStatus" ADD VALUE 'READY' BEFORE 'DONE';
