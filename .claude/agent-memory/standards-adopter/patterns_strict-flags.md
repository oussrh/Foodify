---
name: patterns-strict-flags
description: How the two strict flags (noUncheckedIndexedAccess, exactOptionalPropertyTypes) were taken to zero on 2026-09-21 - the Prisma boundary helper, when to widen a prop vs spread, the zod exactOptional trap, the python edit encoding trap
metadata:
  type: project
---

Phase 9 flipped both flags in one pass (53 + 86 = 140 errors, 72 files, no escape, no `!`).

**Why:** a fix chosen wrong relocates the flag's complaint or changes behaviour; these are the
shapes that held, and the two traps met.

**How to apply:**
- Zod `.optional()` -> Prisma `data`: do NOT switch the schema to `.exactOptional()` (zod 4.6
  has it) - at runtime it delegates `undefined` to the inner type and a form that sends
  `{ email: undefined }` starts failing validation. Strip at the boundary instead:
  `lib/defined-fields.ts` (`definedFields(patch)`, typed so required keys stay required and
  `T | undefined` keys become `?: T`); Prisma already ignores an undefined member, so the
  behaviour is identical and the type now says so.
- A prop forwarded from an optional parent prop (`disabled`, `error={errors.x}`, `original`,
  `url`): widen the CHILD's declaration to `?: T | undefined`. Zero runtime change (React
  received the undefined before). Conditional spread only where the receiver is third-party
  (`ResendProvider`, Radix `Select defaultValue`, Playwright `workers`) and note that a default
  the library applies when a key is absent may now apply (Auth.js merge overwrites with
  undefined; conditional spread keeps the library default).
- `where: cond ? {...} : undefined` -> `: {}` for Prisma (same query). A `findUnique` keyed
  on a possibly-empty email needs a real guard (the old code threw a Prisma validation error).
- Index reads: prefer a shape that has no index (`h.replace(/./g, c => c + c)` for 3-digit
  hex, `linear(r)` per channel instead of `lin[0]`, destructure regex groups with `?? []`,
  a tuple return type `[Icon, Icon, Icon]` for a literal 3-array). Zod's `issues[0].message`
  -> `firstIssue(error)` in lib/schemas/common.ts. `mock.calls[0]` in tests ->
  `callArgs(mock, n)` in test/mock-calls.ts (throws with the call count).
- `describe.each(Object.entries(record))` + `UI_PAIRS[name]` cannot be typed: put the
  per-theme data in an array of objects and `describe.each(THEMES)('$name', ...)`.
- Trap: python `Path.read_text()` on this Windows box is cp1252 and crashes on `"` (0x9D) in
  a component's copy; always `encoding='utf-8'` in and out (scratchpad `edit.py`).
- Proof shape that worked: HEAD copies under a temporary in-repo folder (bare imports must
  resolve), one differential vitest file, sweep of inputs, negative control by sed-mutating
  one literal, restore with the inverse sed, `git diff --stat` shows the refactor intact.
