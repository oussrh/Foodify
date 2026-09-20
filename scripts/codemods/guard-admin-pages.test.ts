import { describe, expect, it } from 'vitest'
import { guardPage } from './guard-admin-pages.mjs'

describe('guardPage', () => {
  it('puts the guard first in an async page and imports it after the last import', () => {
    const src = `import Link from 'next/link'\nimport {\n  A,\n  B,\n} from '@/x'\n\nexport default async function Page({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params\n  return <A id={id} />\n}\n`
    const { text, changed } = guardPage(src)
    expect(changed).toBe(true)
    expect(text).toBe(`import Link from 'next/link'\nimport {\n  A,\n  B,\n} from '@/x'\nimport { requireSuperAdminPage } from '@/lib/auth-guard'\n\nexport default async function Page({ params }: { params: Promise<{ id: string }> }) {\n  await requireSuperAdminPage()\n  const { id } = await params\n  return <A id={id} />\n}\n`)
  })

  it('makes a sync page async', () => {
    const src = `import F from '@/f'\n\nexport default function Page() {\n  return <F />\n}\n`
    expect(guardPage(src).text).toBe(`import F from '@/f'\nimport { requireSuperAdminPage } from '@/lib/auth-guard'\n\nexport default async function Page() {\n  await requireSuperAdminPage()\n  return <F />\n}\n`)
  })

  it('leaves a guarded page alone', () => {
    const src = `import { requireSuperAdminPage } from '@/lib/auth-guard'\n\nexport default async function Page() {\n  await requireSuperAdminPage()\n  return null\n}\n`
    expect(guardPage(src)).toEqual({ text: src, changed: false })
  })
})
