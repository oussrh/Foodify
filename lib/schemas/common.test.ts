import { describe, expect, it } from 'vitest'
import { bilingualName, email, firstIssue, money, password, uuid } from './common'

describe('the shared pieces', () => {
  it('accepts a v4 UUID and refuses a cuid', () => {
    expect(uuid.safeParse('4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e7f').success).toBe(true)
    expect(uuid.safeParse('clx1234567890abcdef').success).toBe(false)
  })

  it('names the email rule in the form\'s words', () => {
    expect(email.safeParse('not-an-email').error?.issues[0]?.message).toBe('Please enter a valid email address')
  })

  it('reads the first issue of a failed parse as the message to show', () => {
    const r = bilingualName.safeParse({ nameEn: '', nameFr: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(firstIssue(r.error)).toBe('English name is required')
  })

  it('wants six characters of password', () => {
    expect(password.safeParse('12345').success).toBe(false)
    expect(password.safeParse('123456').success).toBe(true)
  })

  it('requires both names of a bilingual entity', () => {
    const r = bilingualName.safeParse({ nameEn: 'Salads', nameFr: '' })
    expect(r.error?.issues.map((i) => i.message)).toEqual(['French name is required'])
  })
  it('carries money as a two-decimal string and refuses a float\'s formatting', () => {
    expect(money.parse('12')).toBe('12.00')
    expect(money.parse('12.5')).toBe('12.50')
    expect(money.safeParse('12.345').success).toBe(false)
    expect(money.safeParse('1e3').success).toBe(false)
    expect(money.safeParse('-1').success).toBe(false)
  })
})
