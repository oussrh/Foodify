// abatty-probes/shape.mjs
// CODE-SHAPE (phase 7): the function-shape rules run at error over the whole tree; the files
// they are still off for are listed in scripts/ci/shape-exemptions.json, a list generated from
// the findings (scripts/codemods/shape-exemptions.mjs) and checked by the lint script. This
// probe counts the list, so it can only shrink; at zero the rules are unconditional.

const EXEMPTIONS = 'scripts/ci/shape-exemptions.json'

/** @type {import("abatty").Probe} */
export const shapeExemptions = {
  metric: 'fn.shapeExemptions',
  kind: 'ratchet',
  standard: ['CODE.2'],
  title: 'Files exempted from the function-shape rules',
  why: 'A function over 60 lines (150 in a component), 4 parameters or complexity 12 is what an agent stops reading whole. The rules are at error everywhere except the files this list names; the list is written by a script from the findings and refused by the lint script when stale. The count is the number of files still exempted.',
  approximates: 'the length of scripts/ci/shape-exemptions.json; that the listed files still fail is the lint script\'s check (shape-exemptions.mjs --check), not this probe\'s',
  axis: 'navigability',
  lossAt: 50,
  emptyScanOk: true,
  scan: (c) => {
    if (!c.exists(EXEMPTIONS)) return { scanned: 0, findings: [] }
    const list = c.readJson(EXEMPTIONS)
    const files = Array.isArray(list?.files) ? list.files : []
    return { scanned: 1, findings: files.map((path) => ({ path, line: 1, detail: 'exempted from the shape rules' })) }
  },
  controls: [
    {
      name: 'each listed file counts',
      files: { 'scripts/ci/shape-exemptions.json': '{ "generatedAt": "2026-09-20", "files": ["components/a.tsx", "components/b.tsx"] }\n', 'components/a.tsx': 'export const a = 1\n', 'components/b.tsx': 'export const b = 1\n' },
      expect: 2,
    },
    {
      name: 'an empty list, or no list, is zero',
      files: { 'scripts/ci/shape-exemptions.json': '{ "generatedAt": "2026-09-20", "files": [] }\n', 'components/a.tsx': 'export const a = 1\n' },
      expect: 0,
    },
  ],
}
