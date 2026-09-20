---
name: patterns-shape-seams
description: Seams that took the eleven admin forms and managers under the function-shape rules in phase 7, and the eslint override that measures the exempted files
metadata:
  type: feedback
---

Measure an exempted file with the rules forced on: a scratch flat config
`export default [...base, { files: [...], rules: SHAPE_RULE_CONFIG }, { files: ['**/*.tsx'], rules: { 'max-lines-per-function': COMPONENT_LINES } }]`
(imports by `file:///C:/...` URL on Windows) and `pnpm exec eslint -c <it> -f json <files>`; the
project's own config turns the rules off for listed files, so plain eslint says nothing.

Seams that worked (each a thing the piece is FOR, never a line count):
- two near-duplicate managers: one shared row/card/dialog with OPTIONAL delete handlers (the portal
  that may delete passes them; the DOM of the other stays without), three small hooks split by tree
  level (categories / subcategories / collapse state), the role-specific status handlers stay in the
  entry component.
- a state used only by a dialog and a sibling list (`isDialogOpen`) moves into a section component
  that owns both.
- an identical `{previewModel && <Dialog/>}` block in two forms is one component.
- a run of `a || ''` defaults over N fields (complexity N) is a `for` over a `const FIELDS = [...] as const`.
- nested strength ternaries (level/colour/icon/bar by score) are one tier table `[{ min, tier }]`.
- a submit block that carries the "why disabled" notes is its own component: the branches go with it.
- a shared sticky save bar with one caller adding `mt-6`: `cn('sticky ...', className, 'flex ...')`
  keeps the exact class string of both callers (verified by rendering).
- dead branches (a ternary whose three arms are the same class string) are replaced by the constant.

**Why:** these were the honest cuts on 2026-09-20; relocating a handler whole into a hook was refused
each time the line count alone would have improved.
**How to apply:** phase 7/8 work on components; read `.claude/rules/size-limits.md` first.
