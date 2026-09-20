import { describe, expect, it } from 'vitest'
import { checkExemptions, failingFiles } from './shape-exemptions.mjs'

const root = 'C:\\repo'
const result = (file: string, ruleIds: (string | null)[]) => ({ filePath: `${root}\\${file.replace(/\//g, '\\')}`, messages: ruleIds.map((ruleId) => ({ ruleId })) })

describe('the shape exemption list', () => {
  it('lists the files a shape rule reports, relative and sorted, and no other', () => {
    const results = [result('components/b.tsx', ['complexity']), result('components/a.tsx', ['max-lines-per-function', null]), result('lib/c.ts', ['no-unused-vars'])]
    expect(failingFiles(results, root)).toEqual(['components/a.tsx', 'components/b.tsx'])
  })

  it('reports a listed file that passes as stale and a listed file that is gone as missing', () => {
    const exists = (f: string) => f !== 'components/gone.tsx'
    expect(checkExemptions(['components/a.tsx', 'components/fixed.tsx', 'components/gone.tsx'], ['components/a.tsx'], exists)).toEqual({ stale: ['components/fixed.tsx'], missing: ['components/gone.tsx'] })
    expect(checkExemptions(['components/a.tsx'], ['components/a.tsx'], exists)).toEqual({ stale: [], missing: [] })
  })
})
