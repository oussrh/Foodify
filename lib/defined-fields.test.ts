import { describe, expect, it } from 'vitest'
import { definedFields } from './defined-fields'

describe('definedFields', () => {
  it('drops the members that are undefined and keeps the rest, null included', () => {
    const patch: { email?: string | undefined; name?: string | null | undefined; phone?: string | undefined } = {
      email: 'a@b.c',
      name: null,
      phone: undefined,
    }
    const out = definedFields(patch)
    expect(out).toEqual({ email: 'a@b.c', name: null })
    expect('phone' in out).toBe(false)
  })

  it('keeps a required member as it is', () => {
    const out = definedFields({ nameEn: 'Soup', calories: undefined as number | undefined })
    expect(out).toEqual({ nameEn: 'Soup' })
    const required: string = out.nameEn
    expect(required).toBe('Soup')
  })

  it('leaves the input untouched', () => {
    const patch = { a: 1, b: undefined }
    definedFields(patch)
    expect(patch).toEqual({ a: 1, b: undefined })
  })
})
