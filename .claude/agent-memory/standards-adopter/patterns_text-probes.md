---
name: patterns-text-probes
description: Traps in abatty's text probes met on 2026-09-20 - a comment naming process.env trips valid.wholeEnv, a moved ts-expect-error is a per-file regression, exempt files hide shape errors until the JSON shrinks
metadata:
  type: feedback
---

Three traps of the ratchet's text probes, and the check for each.

**Why:** all three bit during phase 7 T3 (uploads/viewers): the ratchet went red for a
header comment and for an escape that only changed file.

**How to apply:**
- `valid.wholeEnv` (hard, zero) is a text reading: the literal `process.env` in a COMMENT
  outside lib/env.ts is a finding. Write "the environment" in prose; only lib/env.ts may
  spell it.
- `types.escapes` has a per-file floor: moving `@ts-expect-error` from an exempt file into a
  new file is REGRESSED even at the same total. Remove it instead: a typed view
  (`navigator as Navigator & { xr: {...} }`) behind the same feature test is not counted
  and keeps behaviour; `as` casts are not escapes, `: any`, `as any`, `@ts-*` are.
- The real eslint config turns the shape rules OFF for files in
  scripts/ci/shape-exemptions.json, so `pnpm exec eslint` on a territory file is green
  even when it still fails. Measure with the rules forced:
  `eslint --no-inline-config --rule 'max-lines-per-function: ["error",{"max":150,...}]'
  --rule 'complexity: ["error",{"max":12}]' --rule 'max-params: ["error",{"max":4}]'`
  (60 lines for .ts files). The success signal is
  `node scripts/codemods/shape-exemptions.mjs --check` printing `stale exemption: <file>`.
  New files are not exempt, so a mutation test of the switch works on them with the real
  config (61-line function: red; restore: green).
- ESLint 9 `complexity` counts default parameter values (`AssignmentPattern`) and optional
  chaining (`?.`) as branches; a JSX ternary counts like any other.
