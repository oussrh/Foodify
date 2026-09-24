import { describe, expect, it } from 'vitest'
import { clientInput, credentials, emailToken, otpRequest } from './user'

describe('user schemas', () => {
  it('refuses a restaurant id that is not a UUID on a new client', () => {
    expect(clientInput.safeParse({ email: 'a@b.co', password: 'secret1', restaurantIds: ['nope'] }).success).toBe(false)
    expect(clientInput.safeParse({ email: 'a@b.co', password: 'secret1' }).success).toBe(true)
  })

  it('accepts a change-email token of 64 hex characters and nothing else', () => {
    expect(emailToken.safeParse('a'.repeat(64)).success).toBe(true)
    expect(emailToken.safeParse('A'.repeat(64)).success).toBe(false)
    expect(emailToken.safeParse("' OR 1=1").success).toBe(false)
  })

  it('keeps the sign-in request loose: any non-empty email and password', () => {
    expect(otpRequest.safeParse({ email: 'admin', password: 'x' }).success).toBe(true)
    expect(otpRequest.safeParse({ email: '', password: 'x' }).success).toBe(false)
  })

  it('knows the two portals a credentials sign-in can name', () => {
    expect(credentials.safeParse({ email: 'a', password: 'b', role: 'RESTAURANT_ADMIN' }).success).toBe(true)
    expect(credentials.safeParse({ email: 'a', password: 'b', role: 'ROOT' }).success).toBe(false)
  })

  it('reads a sign-in code as six digits or as no code, never refusing the sign-in for it', () => {
    const base = { email: 'a@b.c', password: 'secret' }
    expect(credentials.parse({ ...base, code: '123456' }).code).toBe('123456')
    expect(credentials.parse({ ...base, code: 'undefined' }).code).toBeUndefined()
    expect(credentials.parse({ ...base, code: '12345' }).code).toBeUndefined()
    expect(credentials.parse(base).code).toBeUndefined()
  })

  it('bounds the new restaurant name a client is created with, trimmed', () => {
    const base = { email: 'manager@example.com', password: 'secret' }
    expect(clientInput.parse({ ...base, restaurantName: '  Chez Test ' }).restaurantName).toBe('Chez Test')
    expect(clientInput.safeParse({ ...base, restaurantName: 'x'.repeat(121) }).success).toBe(false)
  })
})
