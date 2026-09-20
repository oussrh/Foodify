import { describe, expect, it } from 'vitest'
import { removeUnusedImports } from './remove-unused-imports.mjs'

// Marks are "line:column" of the binding's name, 1-based, as ESLint reports them.
const marks = (...at: string[]) => new Set(at)

describe('removeUnusedImports', () => {
  it('drops one binding from a single-line named import and keeps the rest', () => {
    const src = `import { A, B, C } from 'x'\nexport const v = [A, C]\n`
    const { text, removed, statements } = removeUnusedImports(src, marks('1:13'))
    expect(text).toBe(`import { A, C } from 'x'\nexport const v = [A, C]\n`)
    expect(removed).toBe(1)
    expect(statements).toBe(0)
  })

  it('removes the whole statement, and its line, when nothing survives', () => {
    const src = `import { Gone } from 'x'\nimport { Kept } from 'y'\nexport const v = Kept\n`
    const { text, statements } = removeUnusedImports(src, marks('1:10'))
    expect(text).toBe(`import { Kept } from 'y'\nexport const v = Kept\n`)
    expect(statements).toBe(1)
  })

  it('removes a whole statement without touching the line before it', () => {
    const src = `import { Kept } from 'y'\nimport { Gone } from 'x'\nimport { Also } from 'z'\nexport const v = [Kept, Also]\n`
    expect(removeUnusedImports(src, marks('2:10')).text).toBe(`import { Kept } from 'y'\nimport { Also } from 'z'\nexport const v = [Kept, Also]\n`)
  })

  it('keeps a multi-line import list multi-line', () => {
    const src = `import {\n  A,\n  B,\n  C,\n} from 'x'\nexport const v = [A, C]\n`
    const { text } = removeUnusedImports(src, marks('3:3'))
    expect(text).toBe(`import {\n  A,\n  C,\n} from 'x'\nexport const v = [A, C]\n`)
  })

  it('drops an unused default import but keeps the named ones, and the reverse', () => {
    const src = `import D, { A } from 'x'\nexport const v = A\n`
    expect(removeUnusedImports(src, marks('1:8')).text).toBe(`import { A } from 'x'\nexport const v = A\n`)
    const src2 = `import D, { A } from 'x'\nexport const v = D\n`
    expect(removeUnusedImports(src2, marks('1:13')).text).toBe(`import D from 'x'\nexport const v = D\n`)
  })

  it('preserves type-only imports, aliases and a trailing semicolon', () => {
    const src = `import type { A, B as Bee } from 'x';\nexport type V = Bee\n`
    expect(removeUnusedImports(src, marks('1:15')).text).toBe(`import type { B as Bee } from 'x';\nexport type V = Bee\n`)
  })

  it('drops an unused namespace import and keeps a used one beside a dropped default', () => {
    expect(removeUnusedImports(`import * as N from 'x'\nexport const v = 1\n`, marks('1:13')).text).toBe(`export const v = 1\n`)
    const src = `import D, * as N from 'x'\nexport const v = N\n`
    expect(removeUnusedImports(src, marks('1:8')).text).toBe(`import * as N from 'x'\nexport const v = N\n`)
  })

  it('drops an aliased binding by the column of its local name', () => {
    const src = `import { A as Ay, B as Bee } from 'x'\nexport const v = Ay\n`
    expect(removeUnusedImports(src, marks('1:24')).text).toBe(`import { A as Ay } from 'x'\nexport const v = Ay\n`)
  })

  it('takes a trailing comment along with a removed statement', () => {
    const src = `import { Gone } from 'x' // why it was here\nexport const v = 1\n`
    expect(removeUnusedImports(src, marks('1:10')).text).toBe(`export const v = 1\n`)
  })

  it('leaves an unused binding that is not an import alone', () => {
    const src = `import { A } from 'x'\nconst unused = 1\nexport const v = A\n`
    const { text, removed } = removeUnusedImports(src, marks('2:7'))
    expect(text).toBe(src)
    expect(removed).toBe(0)
  })

  it('keeps the "use client" directive and comments above the first import', () => {
    const src = `'use client'\n\n// why\nimport { Gone, Kept } from 'x'\nexport const v = Kept\n`
    expect(removeUnusedImports(src, marks('4:10')).text).toBe(`'use client'\n\n// why\nimport { Kept } from 'x'\nexport const v = Kept\n`)
  })
})
