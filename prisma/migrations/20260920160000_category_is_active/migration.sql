-- MenuCategory.isActive and MenuSubcategory.isActive entered the schema on 2025-07-31 (a042180)
-- through `prisma db push`, so no migration carried them and `prisma migrate deploy` built a
-- database the seed could not use (CI run 35521210370). IF NOT EXISTS keeps this migration
-- harmless on the databases that already got the columns from db push.

-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MenuSubcategory" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
