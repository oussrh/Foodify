// abatty-probes/dup.mjs
// CODE.12 (phase 12): duplication measured by jscpd as two ratchet metrics, the number of exact
// clones and the lines they cover. jscpd is run here, synchronously, over the same roots the
// graph script cruises, at its default thresholds (a clone is 5 lines and 50 tokens repeated),
// tests and browser specs left out. One run serves both metrics: the report is kept per
// measurement (the context object) so a second measurement in one process runs again. Run
// directly (`pnpm dup`), the module prints jscpd's own table with the same flags, so what a
// human reads is what the ratchet counts.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The same roots as the graph script (package.json → graph), and the same exclusions as the
// shape rules: a test describes a behaviour per block and repeats itself on purpose.
const ROOTS = ['app', 'components', 'lib', 'server', 'auth.ts', 'proxy.ts']
const FLAGS = ['--format', 'typescript,tsx,javascript,jsx', '--ignore', '**/*.test.ts,**/*.test.tsx,**/e2e/**,**/tests/**,**/generated/**']

const require = createRequire(import.meta.url)
// jscpd's `exports` hides its bin: the package root is two levels above its main entry
// (dist/src/index.js), and the declared bin is bin/jscpd.
const JSCPD = join(dirname(require.resolve('jscpd')), '..', '..', 'bin', 'jscpd')

/** @typedef {{ lines: number, first: string, firstLine: number, second: string, secondLine: number }} Clone */
/** @typedef {{ sources: number, clones: Clone[] }} Report */

/** One jscpd run per measurement: the report is kept on the context object, never across measurements. @type {WeakMap<object, Report>} */
const reports = new WeakMap()

/** jscpd over the roots that exist under `dir`, its stderr in the thrown message when it fails. @param {string} dir @param {string[]} extra */
function runJscpd(dir, extra) {
  const roots = ROOTS.filter((r) => existsSync(join(dir, r)))
  if (roots.length === 0) return null
  return execFileSync(process.execPath, [JSCPD, ...roots, ...FLAGS, ...extra], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
}

/** jscpd's JSON report for `dir`, empty when no file survived its filters (every file under its minimum, no root or format match: the reporter writes nothing then); its stderr in the error when it fails. @param {string} dir */
function jsonReport(dir) {
  const out = mkdtempSync(join(tmpdir(), 'jscpd-'))
  try {
    const ran = runJscpd(dir, ['--reporters', 'json', '--output', out, '--silent'])
    const reportFile = join(out, 'jscpd-report.json')
    if (ran === null || !existsSync(reportFile)) return { statistics: { total: { sources: 0 } }, duplicates: [] }
    return JSON.parse(readFileSync(reportFile, 'utf8'))
  } catch (e) {
    const said = e && typeof e === 'object' && 'stderr' in e ? String(e.stderr).trim() : ''
    throw new Error(`jscpd failed${said ? `: ${said}` : ''}`)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
}

/**
 * A clone as charged: to the lexicographically smaller of its two paths. jscpd's own "first file"
 * is the one it happened to read later, which follows the traversal order and would move a
 * file's debt with a rename. @param {string} dir @param {any} d one of the report's `duplicates`
 * @returns {Clone}
 */
function toClone(dir, d) {
  const rel = (name) => relative(dir, resolve(dir, name)).replace(/\\/g, '/')
  const a = { path: rel(d.firstFile.name), line: d.firstFile.startLoc.line }
  const b = { path: rel(d.secondFile.name), line: d.secondFile.startLoc.line }
  const [first, second] = a.path < b.path ? [a, b] : [b, a]
  return { lines: d.lines, first: first.path, firstLine: first.line, second: second.path, secondLine: second.line }
}

/**
 * The clones under `dir` and how many files jscpd read (its `sources`, so a moved root reads as a
 * scan of nothing, not as zero clones), once per measurement.
 * @param {object} ctx the measurement's context @param {string} dir
 * @returns {Report}
 */
function reportOf(ctx, dir) {
  const known = reports.get(ctx)
  if (known) return known
  const report = jsonReport(dir)
  const result = { sources: report.statistics?.total?.sources ?? 0, clones: (report.duplicates ?? []).map((d) => toClone(dir, d)) }
  reports.set(ctx, result)
  return result
}

/** The probe result: one finding per clone, weighted by `weightOf` (one, or the clone's lines). @param {object} c @param {(clone: Clone) => number} weightOf */
function scan(c, weightOf) {
  const { sources, clones } = reportOf(c, c.repo)
  return {
    scanned: sources,
    findings: clones.map((clone) => ({ path: clone.first, line: clone.firstLine, detail: `${clone.lines} lines also at ${clone.second}:${clone.secondLine}`, weight: weightOf(clone) })),
  }
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
  approximates: "jscpd's exact-clone detection at its default thresholds, each clone charged to the lexicographically smaller of its two files",
  axis: 'navigability',
  lossAt: 200,
  scan: (c) => scan(c, () => 1),
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
  scan: (c) => scan(c, (clone) => clone.lines),
  controls: controls(15, 0),
}

// `pnpm dup`: the same run, jscpd's own table on the terminal.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(runJscpd(process.cwd(), ['--reporters', 'console']) ?? 'no source root found\n')
}
