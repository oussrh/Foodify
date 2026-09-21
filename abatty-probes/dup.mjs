// abatty-probes/dup.mjs
// CODE.12 (phase 12): duplication measured by jscpd as two ratchet metrics, the number of exact
// clones and the lines they cover. jscpd is run here, synchronously, over the same roots the
// graph script cruises, at its default thresholds (a clone is 5 lines and 50 tokens repeated),
// tests and browser specs left out; the human-readable run is `pnpm dup`. One run serves both
// metrics: the report is kept per scanned directory for the life of the process.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'

// The same roots as the graph script (package.json → graph), and the same exclusions as the
// shape rules: a test describes a behaviour per block and repeats itself on purpose.
const ROOTS = ['app', 'components', 'lib', 'auth.ts', 'proxy.ts']
const IGNORE = '**/*.test.ts,**/*.test.tsx,**/e2e/**,**/tests/**,**/generated/**'
const FORMATS = 'typescript,tsx,javascript,jsx'

const require = createRequire(import.meta.url)
// jscpd's `exports` hides its bin: the package root is two levels above its main entry (dist/src/index.js).
const JSCPD = join(dirname(require.resolve('jscpd')), '..', 'bin', 'jscpd')
/** @type {Map<string, Clone[]>} */
const reports = new Map()

/** @typedef {{ lines: number, first: string, firstLine: number, second: string, secondLine: number }} Clone */

/** The clones jscpd finds under `dir`, run once per directory; the roots that do not exist are skipped. @param {string} dir */
function clonesOf(dir) {
  const known = reports.get(dir)
  if (known) return known
  const roots = ROOTS.filter((r) => existsSync(join(dir, r)))
  if (roots.length === 0) return []
  const out = mkdtempSync(join(tmpdir(), 'jscpd-'))
  try {
    execFileSync(process.execPath, [JSCPD, ...roots, '--format', FORMATS, '--ignore', IGNORE, '--reporters', 'json', '--output', out, '--silent'], { cwd: dir, stdio: 'ignore' })
    // No report is written when nothing is duplicated; jscpd names files relative to its cwd.
    const reportFile = join(out, 'jscpd-report.json')
    const report = existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, 'utf8')) : {}
    const rel = (name) => relative(dir, resolve(dir, name)).replace(/\\/g, '/')
    const clones = (report.duplicates ?? []).map((d) => ({
      lines: d.lines,
      first: rel(d.firstFile.name),
      firstLine: d.firstFile.startLoc.line,
      second: rel(d.secondFile.name),
      secondLine: d.secondFile.startLoc.line,
    }))
    reports.set(dir, clones)
    return clones
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
}

/** One finding per clone, charged to the file jscpd lists first; `weight` is the clone's lines when `byLines`. @param {string} dir @param {boolean} byLines */
function findings(dir, byLines) {
  return clonesOf(dir).map((c) => ({
    path: c.first,
    line: c.firstLine,
    detail: `${c.lines} lines also at ${c.second}:${c.secondLine}`,
    ...(byLines ? { weight: c.lines } : {}),
  }))
}

// A twelve-line block, over jscpd's default of five lines and fifty tokens, so a copy is a clone;
// jscpd reports the whole fifteen-line function (the differing names are one token each).
const BLOCK = Array.from({ length: 12 }, (_, i) => `  if (input.field${i} === undefined) throw new Error('field${i} is required for ${'the record'}')`).join('\n')
const copy = (name) => `export function ${name}(input: Record<string, unknown>) {\n${BLOCK}\n  return input\n}\n`

const controls = (expectCloned, expectDistinct) => [
  {
    name: 'the same twelve-line block in two files is one clone',
    files: { 'lib/a.ts': copy('checkA'), 'lib/b.ts': copy('checkB') },
    expect: expectCloned,
  },
  {
    name: 'two files with nothing in common are zero',
    files: { 'lib/a.ts': 'export const a = 1\n', 'lib/b.ts': 'export const b = (x: number) => x + 1\n' },
    expect: expectDistinct,
  },
]

/** @type {import("abatty").Probe} */
export const dupClones = {
  metric: 'dup.clones',
  kind: 'ratchet',
  standard: ['CODE.12'],
  title: 'Exact clones jscpd finds in the source roots',
  why: 'Two copies of a block fix one bug twice, or once. The count is the number of repeated blocks of at least five lines and fifty tokens over app, components, lib, auth.ts and proxy.ts, tests left out; it may only fall.',
  approximates: "jscpd's exact-clone detection at its default thresholds, charged to the file it lists first",
  axis: 'navigability',
  lossAt: 200,
  scan: (c) => ({ scanned: c.sourceFiles.length, findings: findings(c.repo, false) }),
  controls: controls(1, 0),
}

/** @type {import("abatty").Probe} */
export const dupClonedLines = {
  metric: 'dup.clonedLines',
  kind: 'ratchet',
  standard: ['CODE.12'],
  title: 'Lines the clones cover',
  why: 'The size of the duplication, not only its count: one 50-line clone is more to fix twice than five of five lines. The sum of the lines of every clone dup.clones counts; it may only fall.',
  approximates: "the `lines` of each clone in jscpd's report, summed",
  axis: 'navigability',
  lossAt: 2000,
  scan: (c) => ({ scanned: c.sourceFiles.length, findings: findings(c.repo, true) }),
  controls: controls(15, 0),
}
