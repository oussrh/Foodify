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
})
