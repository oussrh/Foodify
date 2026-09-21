---
name: patterns-jsdoc-boundary
description: Phase 11 recipe for lib/** JSDoc (territory A) - anchor-table insert with a line-1 case, trace every stated number to its constant, exported schema consts are invisible to the rule, the red/green pair. STUB - the body was lost to an overwrite on 2026-09-21; only the index hook survived
metadata:
  type: feedback
---

STUB. The territory-B agent overwrote this file on 2026-09-21 with its own note (now
`patterns_jsdoc-actions-routes.md`) before checking the name was taken. The original body is
lost; the four hooks its index line carried are kept here so the lesson is not lost entirely.
The lib/** agent of phase 11 should rewrite it from its own context.

- Insert the blocks from an anchor table, with a case for an export on line 1 (nothing
  precedes it to anchor on).
- Trace every number a block states to the constant that holds it, never to memory.
- Exported schema consts (`export const x = z.object(...)`) are invisible to
  `jsdoc/require-jsdoc` as configured (it lists functions, arrow functions, type aliases and
  interfaces): they are documented by choice, and a green lint does not prove them documented.
- The red/green pair: a mutation on one block that the rule refuses, the restore, both runs logged.

**Why:** two agents of one phase share the memory directory; `Write` replaces silently and the
system note says not to check for the DIRECTORY, which is not a licence to skip checking the FILE.

**How to apply:** `ls` the memory directory for a same-named or same-topic file before writing;
name a note by territory when a parallel agent could be writing the same topic.
