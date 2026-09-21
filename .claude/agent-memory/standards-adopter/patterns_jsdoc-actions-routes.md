---
name: patterns-jsdoc-actions-routes
description: Phase 11 (CODE.7) recipe for JSDoc on actions and routes - the facts a block must state come from the guard, the schema, the payload and the migration SQL, not the function; the five claims I got wrong on first draft and the check for each
metadata:
  type: feedback
---

A JSDoc block on a server action or route handler is only worth its lines when every sentence
was read off something other than the function body: the guard (`lib/auth-guard.ts`), the
schema (`lib/schemas/*.ts`), the payload select (`lib/payloads.ts`), the FK actions in
`prisma/migrations/*/migration.sql`, and the session shape (`auth.ts` jwt callback).

**Why:** on 2026-09-21 (phase 11, territory B) five of 43 first-draft sentences were false
and only a second read against those files caught them.

**How to apply:** before writing "answers", "refuses", "cascades", "strict", "moved", check:
- `z.object` STRIPS unknown keys; only `.strict()` is strict. Say "as `<schema>` says".
- A toggle that reads then writes `!value` makes ONE flip under a race, it does not cancel.
- `updateMany(...).count` counts matched rows, not changed ones ("how many ids were the
  parent's rows", not "rows moved").
- A cursor `decodeCursor` cannot read is `{}`: the list RESTARTS, it is not a 400; only
  `limit` (and an empty cursor) fails `listQuery`.
- `definedFields` drops `undefined` only: `''` from an `.optional()` string is STORED (an
  empty AR URL clears the column; `if (data.x)` skips the upload but not the write).
- FK actions live in the migration SQL, not the Prisma schema alone: a required relation
  with no `onDelete` is RESTRICT (Ingredient, DishView on Dish), and `MenuSubcategory` -> Dish
  is CASCADE even though `subcategoryId` is nullable.
- A JWT session keeps the email it was signed in with; an action that finds the user by
  `session.user.email` misses after a confirmed email change until re-sign-in.
- A `//` line comment between a JSDoc block and its export breaks the attachment for
  `jsdoc/require-jsdoc`; fold the line comment into the block (the diff then shows a
  removed comment line, say so in the report).
- The one-line `/** ... */` form has no `/**\n`; a script that finds blocks by `rindex("/**\n")`
  grabs the previous block. Search for `\n/**` instead.
- Mutation test that works: add `@param {NextRequest} request` to one block (red on
  `jsdoc/no-types`), delete one block (red on `jsdoc/require-jsdoc`), restore, green.
