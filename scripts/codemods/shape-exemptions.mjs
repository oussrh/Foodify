#!/usr/bin/env node
// scripts/codemods/shape-exemptions.mjs
// The exemption list of the function-shape rules (CODE-SHAPE, phase 7): the files that still
// fail max-lines-per-function, complexity or max-params at the standard's thresholds. It is
// generated from the findings, never hand-maintained: `--write` rewrites
// scripts/ci/shape-exemptions.json from a run of the three rules over the whole tree, and
// `--check` (the lint script) fails when a listed file no longer fails any of them (a stale
// exemption: the file is fixed, so the list must shrink) or when the list carries a file that
// does not exist. eslint.config.mjs turns the rules off for the listed files, so a new failure
// in any other file is a lint error the moment it is written.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { ESLint } from 'eslint'

export const EXEMPTIONS_FILE = 'scripts/ci/shape-exemptions.json'
export const SHAPE_RULES = ['max-lines-per-function', 'complexity', 'max-params']
// The thresholds of the standard (size-limits.md): 60 lines, 150 in a component file, 4
// parameters, complexity 12. Blank lines and comments do not count.
export const SHAPE_RULE_CONFIG = {
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true }],
  complexity: ['error', { max: 12 }],
  'max-params': ['error', { max: 4 }],
}
export const COMPONENT_LINES = ['error', { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true }]

/** The exemption list on disk: relative paths with forward slashes, sorted. */
export function readExemptions(file = EXEMPTIONS_FILE) {
  if (!existsSync(file)) return []
  const parsed = JSON.parse(readFileSync(file, 'utf8'))
  return Array.isArray(parsed.files) ? parsed.files : []
}

/** The files a run of the three rules reports, from ESLint's results. */
export function failingFiles(results, root) {
  const files = new Set()
  for (const r of results) {
    if (r.messages.some((m) => SHAPE_RULES.includes(m.ruleId))) files.add(toRel(r.filePath, root))
  }
  return [...files].sort()
}

const toRel = (abs, root) => {
  const a = abs.replace(/\\/g, '/')
  const r = root.replace(/\\/g, '/')
  return a.startsWith(r + '/') ? a.slice(r.length + 1) : a
}

/**
 * What --check reports for a list against a run: the listed files that no longer fail (stale)
 * and the listed files that do not exist. An empty report is a list that matches its reason.
 */
export function checkExemptions(listed, failing, exists) {
  const failingSet = new Set(failing)
  return {
    stale: listed.filter((f) => exists(f) && !failingSet.has(f)),
    missing: listed.filter((f) => !exists(f)),
  }
}

async function run(mode) {
  const root = process.cwd()
  const listed = readExemptions()
  // The rules forced on everywhere: the exemptions must not hide their own reason.
  const eslint = new ESLint({
    cwd: root,
    overrideConfig: [
      { files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'], rules: SHAPE_RULE_CONFIG },
      { files: ['**/*.tsx'], rules: { 'max-lines-per-function': COMPONENT_LINES } },
      // the same carve-out as the config: a spec's describe body is one long arrow by design
      { files: ['**/*.test.{ts,tsx}', 'e2e/**'], rules: { 'max-lines-per-function': 'off' } },
    ],
  })
  const targets = mode === 'check' ? listed.filter((f) => existsSync(f)) : ['.']
  const results = targets.length ? await eslint.lintFiles(targets) : []
  const failing = failingFiles(results, root)
  if (mode === 'write') {
    writeFileSync(EXEMPTIONS_FILE, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), files: failing }, null, 2) + '\n')
    console.log(`${failing.length} file(s) exempted, written to ${EXEMPTIONS_FILE}`)
    return 0
  }
  const { stale, missing } = checkExemptions(listed, failing, existsSync)
  for (const f of stale) console.error(`stale exemption: ${f} passes the shape rules; remove it from ${EXEMPTIONS_FILE}`)
  for (const f of missing) console.error(`missing file: ${f} is exempted but does not exist`)
  if (stale.length || missing.length) return 1
  console.log(`${listed.length} shape exemption(s), each still failing (dry run of the list; --write regenerates it)`)
  return 0
}

if (process.argv[1]?.endsWith('shape-exemptions.mjs')) {
  const mode = process.argv.includes('--write') ? 'write' : 'check'
  run(mode).then((code) => process.exit(code))
}
