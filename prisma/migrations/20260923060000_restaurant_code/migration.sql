-- The short name a restaurant goes by in a link. A uuid is thirty-six characters of noise, and
-- these links are read off a screen and typed into a tablet by somebody standing up.
--
-- Added nullable, backfilled, then made NOT NULL: an existing table cannot take a unique NOT NULL
-- column in one step. The backfill draws from the same alphabet the application does (Crockford's:
-- no I, L, O or U, because they are read as other characters) and retries while any row is still
-- null, so a collision on the unique index costs a redraw rather than a failed migration.
ALTER TABLE "Restaurant" ADD COLUMN "code" TEXT;

CREATE UNIQUE INDEX "Restaurant_code_key" ON "Restaurant"("code");

DO $$
DECLARE
  alphabet CONSTANT TEXT := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  target RECORD;
  candidate TEXT;
  attempt INT;
BEGIN
  FOR target IN SELECT "id" FROM "Restaurant" WHERE "code" IS NULL LOOP
    attempt := 0;
    LOOP
      attempt := attempt + 1;
      candidate := '';
      FOR i IN 1..6 LOOP
        candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;
      BEGIN
        UPDATE "Restaurant" SET "code" = candidate WHERE "id" = target."id";
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        IF attempt > 50 THEN
          RAISE EXCEPTION 'could not find a free restaurant code after % attempts', attempt;
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE "Restaurant" ALTER COLUMN "code" SET NOT NULL;
