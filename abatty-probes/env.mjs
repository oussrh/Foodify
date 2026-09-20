// abatty-probes/env.mjs
// VALID.3: the environment object taken whole outside the env module.
import { lineAt } from './text.mjs'

// The environment object taken whole: destructured, aliased or passed on, which the built-in
// read probe (a member read, an index) cannot see. Spelled apart so the probes do not count
// their own text.
const ENV = 'process' + '.env'
const WHOLE_ENV = new RegExp(`\\b${ENV.replace('.', '\\.')}\\b(?![.[])`, 'g')

/** @type {import("abatty").Probe} */
export const wholeEnv = {
  metric: 'valid.wholeEnv',
  kind: 'ratchet',
  standard: ['VALID.3'],
  title: 'The environment object taken whole outside the env module',
  why: 'The built-in read probe sees a member read of the environment; a destructuring, an alias or a function given the whole object reads the same variables past it. The count is the number of such takes outside the env module.',
  approximates: 'a text reading of the environment object not followed by a member read or an index, outside the env module',
  axis: 'boundary-clarity',
  lossAt: 10,
  scan: (c, o) => {
    const env = new RegExp(o.config.envModule)
    const findings = []
    let scanned = 0
    for (const f of c.sourceFiles) {
      if (!/\.[cm]?[jt]sx?$/.test(f) || env.test(f)) continue
      scanned++
      const text = c.read(f)
      for (const m of text.matchAll(WHOLE_ENV)) findings.push({ path: f, line: lineAt(text, m.index), detail: `${ENV} taken whole` })
    }
    return { scanned, findings }
  },
  controls: [
    {
      name: 'a destructuring of the environment in a service counts, and so does passing it on',
      files: { 'src/service.ts': `const { KEY } = ${ENV}\nexport const k = KEY\nexport const all = () => run(${ENV})\n` },
      expect: 2,
    },
    {
      name: 'the env module may take it whole; a read of one variable elsewhere is the other probe\'s',
      files: { 'src/env.ts': `export const env = schema.parse(${ENV})\n`, 'src/service.ts': `export const k = ${ENV}.KEY\n` },
      expect: 0,
    },
  ],
}
