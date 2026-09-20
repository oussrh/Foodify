---
name: patterns-nullish-cluster
description: Trap - a row-to-form-defaults mapping of twenty `?? ''` moved into a helper keeps its complexity (the rule says 23); the seam is a column table plus one loop, with the few narrowed enums explicit
metadata:
  type: feedback
---

A mapping made of many `x ?? ''` / `x || ''` lines is a branch cluster: moving it whole into
`lib/` relocates the violation (ESLint `complexity` counted 23 on `restaurantFormValues`). The
shape that holds is a `const TEXT_COLUMNS = [...] as const satisfies readonly (keyof Row)[]`
table and one `for` that blanks them, with the handful of narrowed enums (`priceRange`,
`menuTheme`) written out beside it.

**Why:** 2026-09-20, phase 7 T4: the two restaurant edit pages shared the same 28-line
defaults literal; the first extraction to `lib/form-defaults.ts` failed the shape rules, the
table passed at complexity 2. Key order of the result changes (spread first); nothing observes
it, but say so in the report.

**How to apply:** Before extracting any "row -> plain object" mapping, count its `??`/`||`;
past ~10, reach for the table. A new `lib/` module needs a test in the same commit or the
`lib/**` coverage floor (branches 81.3) drops - `test/factories/prisma.ts` rows cover both the
null and the set branch in two `toEqual`s.
