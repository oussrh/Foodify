import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { bilingualName, email, firstIssue, money, password, username, uuid } from './common'

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

  it("falls back to the error's own message when a failed parse carries no issue", () => {
    expect(firstIssue(new z.ZodError([]))).toBe(new z.ZodError([]).message)
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

describe('username', () => {
  it('folds to lower case and trims, so a capital typed on a tablet is not a different account', () => {
    expect(username.parse('  Kitchen1  ')).toBe('kitchen1')
  })

  it('takes letters, digits, dot, dash and underscore', () => {
    for (const name of ['waiter1', 'pass.tablet', 'salle-2', 'bar_01']) {
      expect(username.safeParse(name).success, name).toBe(true)
    }
  })

  it('refuses one too short, too long, or with a space or a symbol in it', () => {
    expect(username.safeParse('ab').error?.issues[0]?.message).toBe('A username is at least 3 characters')
    expect(username.safeParse('x'.repeat(33)).error?.issues[0]?.message).toBe('A username is at most 32 characters')
    for (const name of ['two words', 'kitchen@1', 'tablet/1']) {
      expect(username.safeParse(name).success, name).toBe(false)
    }
  })
})
