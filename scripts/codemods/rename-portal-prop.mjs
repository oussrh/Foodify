#!/usr/bin/env node
// scripts/codemods/rename-portal-prop.mjs
// The portal prop of the dashboards' shell components was named `role` ("admin" | "manager"),
// which jsx-a11y reads as an ARIA role; phase 3 held the rule with `ignoreNonDOM` and deferred
// the rename to the day the shells were touched (docs/ADOPTION_DECISIONS.md). This transform
// renames the prop to `portal` in the components that declare it and at every call site
// (CODE.11: the same change in more than ten files). ARIA `role` attributes on DOM elements
// (`role="alert"`, `role="dialog"`) are never touched: only a `role` whose value is one of the two
// portals, or a `role` identifier inside the listed components, changes. Dry run by default;
// `--write` applies.
import { globSync, readFileSync, writeFileSync } from 'node:fs'

// The components that declare the portal prop; inside them every `role` identifier is the portal.
export const DECLARING_FILES = [
  'components/shell/app-shell.tsx',
  'components/shell/user-menu.tsx',
  'components/shell/restaurant-switcher.tsx',
  'components/shell/restaurant-tabs.tsx',
  'components/shell/dishes-list.tsx',
  'components/shell/restaurants-list.tsx',
  'components/shell/row-actions.tsx',
  'components/auth/sign-in-flow.tsx',
]

const PORTAL_VALUE = /\brole=("(?:admin|manager)"|\{(?:role|portal)\})/g
// In a declaring file: the prop in a type, a destructuring, a JSX attribute or an expression,
// but not an ARIA attribute (`role="alert"`) and not the `role:` key sent to signIn.
const IDENTIFIER = /(?<![\w.'"$])role(?=\s*[:,}\]]|\s*\)|\s*&&|\s*===|\s*\?|\s*\.|\s*\[)/g

/** A call site's source with `role="admin" | "manager"` and `role={role}` renamed to `portal`. */
export function renameCallSite(src) {
  return src.replace(PORTAL_VALUE, (m, value) => `portal=${value === '{role}' ? '{portal}' : value}`)
}

/** A declaring component's source with every portal `role` identifier renamed. */
export function renameDeclaring(src) {
  let out = renameCallSite(src)
  out = out.replace(/\brole: cfg\.authRole\b/g, '__SIGNIN_ROLE__')
  out = out.replace(IDENTIFIER, 'portal')
  return out.replace(/__SIGNIN_ROLE__/g, 'role: cfg.authRole')
}

if (process.argv[1]?.endsWith('rename-portal-prop.mjs')) {
  const write = process.argv.includes('--write')
  const files = globSync('{app,components}/**/*.tsx')
  let changed = 0
  for (const f of files) {
    const rel = f.replace(/\\/g, '/')
    const src = readFileSync(f, 'utf8')
    const out = DECLARING_FILES.includes(rel) ? renameDeclaring(src) : renameCallSite(src)
    if (out === src) continue
    changed++
    console.log(`${write ? 'renamed in' : 'would rename in'} ${rel}`)
    if (write) writeFileSync(f, out)
  }
  console.log(`${changed} file(s)${write ? '' : ' (dry run; --write to apply)'}`)
}
