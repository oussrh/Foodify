---
name: patterns-type-only-cycles
description: Trap - depcruise no-circular still fails a value import that closes a cycle through an `import type`; put shared types in a leaf *-types.ts, never in the parent component
metadata:
  type: project
---

`.dependency-cruiser.cjs` sets `to: { circular: true, dependencyTypesNot: ["type-only"] }`, but
the rule is evaluated per edge: `app-shell.tsx -> user-menu.tsx` (a value import) is flagged
when `user-menu.tsx` does `import type { ShellRole } from './app-shell'`. tsc and eslint stay
green, so only `pnpm exec depcruise app components lib auth.ts proxy.ts --config
.dependency-cruiser.cjs --ignore-known --output-type err` (the gate's "graph" step) catches it.

**Why:** hit on 2026-09-20 in phase 7 for the shell and the contact panel; both fixed by moving
the types below both sides (`components/shell/shell-types.ts`,
`components/contact/contact-form-values.ts`).

**How to apply:** when a sub-component extracted from a parent needs a type the parent exports,
create a leaf types module and import it from both. If an outside file already imports the type
from the parent (e.g. `edit-restaurant-form.tsx` -> `ContactFormValues`), keep the parent's
surface with `export type { X } from './x-types'` (knip accepts a re-export that has a consumer,
flags one that has none). Run depcruise and knip before reporting, not only eslint and tsc.
