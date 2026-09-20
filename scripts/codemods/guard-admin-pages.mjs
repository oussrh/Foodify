#!/usr/bin/env node
// scripts/codemods/guard-admin-pages.mjs
// Puts `await requireSuperAdminPage()` as the first statement of every page under
// app/admin/(protected)/ (CODE.11: the same change in more than ten files is a transform).
// Next preserves a layout across client navigations, so the layout's role check runs once per
// mount: a page must re-check on every render (CACHE.2: an authorisation decision is not
// cached). Dry run by default; `--write` applies. A page that already calls the guard is left
// alone, a sync page becomes async.
import { globSync, readFileSync, writeFileSync } from 'node:fs'

const IMPORT = "import { requireSuperAdminPage } from '@/lib/auth-guard'\n"
const CALL = '  await requireSuperAdminPage()\n'
const DEFAULT_EXPORT = /export default (async )?function\s+[A-Za-z_$][\w$]*\s*\(/

/**
 * The page's source with the guard as its first statement, or unchanged when it has one.
 * @param {string} src
 * @returns {{ text: string, changed: boolean }}
 */
export function guardPage(src) {
  if (src.includes('requireSuperAdminPage()')) return { text: src, changed: false }
  const m = src.match(DEFAULT_EXPORT)
  if (!m || m.index === undefined) return { text: src, changed: false }
  // the `{` that opens the body: past the parameter list, whatever braces its type holds
  let depth = 0
  let i = m.index + m[0].length - 1
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++
    else if (src[i] === ')' && --depth === 0) break
  }
  const brace = src.indexOf('{', i)
  if (brace < 0) return { text: src, changed: false }
  let text = src.slice(0, brace + 1) + '\n' + CALL + src.slice(brace + 1).replace(/^\n/, '')
  if (!m[1]) text = text.replace(m[0], m[0].replace('export default function', 'export default async function'))
  if (!text.includes(IMPORT)) {
    // after the last import statement, single or multi-line, with or without bindings
    const imports = [...text.matchAll(/^import\s+(?:[\s\S]*?from\s+)?['"][^'"]+['"];?\n/gm)]
    const last = imports.at(-1)
    const at = last ? last.index + last[0].length : 0
    text = text.slice(0, at) + IMPORT + text.slice(at)
  }
  return { text, changed: true }
}

if (process.argv[1]?.endsWith('guard-admin-pages.mjs')) {
  const write = process.argv.includes('--write')
  const files = globSync('app/admin/(protected)/**/page.tsx')
  let changed = 0
  for (const f of files) {
    const { text, changed: did } = guardPage(readFileSync(f, 'utf8'))
    if (!did) continue
    changed++
    console.log(`${write ? 'guarded' : 'would guard'} ${f}`)
    if (write) writeFileSync(f, text)
  }
  console.log(`${changed} of ${files.length} page(s)${write ? '' : ' (dry run; --write to apply)'}`)
}
