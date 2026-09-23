import { describe, expect, it } from 'vitest'
import { GENERATED_LENGTH, generatePassword } from './password'
import { passwordChange } from './schemas/user'

describe('generatePassword', () => {
  it('is fourteen characters by default', () => {
    expect(generatePassword()).toHaveLength(GENERATED_LENGTH)
    expect(generatePassword(20)).toHaveLength(20)
  })

  it('always holds a capital, a small letter, a digit and a symbol', () => {
    for (let i = 0; i < 200; i++) {
      const p = generatePassword()
      expect(p).toMatch(/[A-Z]/)
      expect(p).toMatch(/[a-z]/)
      expect(p).toMatch(/[0-9]/)
      expect(p).toMatch(/[!#$%*+\-=?@]/)
    }
  })

  it('leaves out the characters a reader confuses', () => {
    const many = Array.from({ length: 200 }, () => generatePassword()).join('')
    expect(many).not.toMatch(/[0O1lI]/)
  })

  it('is different every time', () => {
    const seen = new Set(Array.from({ length: 200 }, () => generatePassword()))
    expect(seen.size).toBe(200)
  })

  it('takes all its randomness from the source it is given', () => {
    // A fixed source gives a fixed password: nothing else (no Math.random) is mixed in.
    const fixed = (out: Uint32Array) => out.map((_, i) => i * 7919)
    expect(generatePassword(GENERATED_LENGTH, fixed)).toBe(generatePassword(GENERATED_LENGTH, fixed))
  })

  it("passes the rule an account holder's own new password is held to", () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword()
      expect(passwordChange.safeParse({ currentPassword: 'old-one', password: p, confirm: p }).success).toBe(true)
    }
  })
})
