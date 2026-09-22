import bcrypt from 'bcryptjs'
import { generateSync } from 'otplib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/generated/prisma/client'

type Update = { where: { id: string }; data: Record<string, unknown> }
// vi.mock is hoisted above these, so the stand-ins come from vi.hoisted.
const { findFirst, update } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn<(args: Update) => Promise<object>>(async () => ({})),
}))
vi.mock('@/lib/prisma', () => ({ default: { user: { findFirst, update } } }))

import { assertPortalRole, completeSecondFactor, userWithPassword } from './sign-in-checks'

const now = new Date('2026-09-20T12:00:00Z')
const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'
let passwordHash = ''

const user = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  email: 'owner@foodify.test',
  passwordHash,
  role: 'RESTAURANT_ADMIN',
  mfaEnabled: true,
  totpSecret: null,
  emailOtpCode: null,
  emailOtpExpires: null,
  emailVerified: null,
  lastLogin: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
} as User)

describe('userWithPassword', () => {
  beforeEach(async () => {
    passwordHash = await bcrypt.hash('correct horse', 4)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('is null for an unknown account and for a wrong password', async () => {
    findFirst.mockResolvedValueOnce(null)
    expect(await userWithPassword('nobody@foodify.test', 'correct horse')).toBeNull()
    findFirst.mockResolvedValueOnce(user())
    expect(await userWithPassword('owner@foodify.test', 'wrong')).toBeNull()
  })

  it('is the account when the password matches', async () => {
    findFirst.mockResolvedValueOnce(user())
    expect(await userWithPassword('owner@foodify.test', 'correct horse')).toMatchObject({ id: 'u1' })
  })

  // A person types an address and a device types the name it was set up with: one lookup answers
  // both, and a name typed with a capital on a tablet keyboard still finds its account.
  it('looks the account up by address or by username, folding the name to lower case', async () => {
    findFirst.mockResolvedValueOnce(user())
    await userWithPassword('Kitchen1', 'correct horse')
    expect(findFirst).toHaveBeenCalledWith({ where: { OR: [{ email: 'Kitchen1' }, { username: 'kitchen1' }] } })
  })
})

describe('assertPortalRole', () => {
  it('lets anyone through when the page names no portal', () => {
    expect(() => assertPortalRole(user(), undefined)).not.toThrow()
  })

  it('lets a user into their own portal and a super admin into either', () => {
    expect(() => assertPortalRole(user(), 'RESTAURANT_ADMIN')).not.toThrow()
    expect(() => assertPortalRole(user({ role: 'SUPER_ADMIN' }), 'RESTAURANT_ADMIN')).not.toThrow()
    expect(() => assertPortalRole(user({ role: 'SUPER_ADMIN' }), 'SUPER_ADMIN')).not.toThrow()
  })

  it('refuses a restaurant admin at the super admin portal', () => {
    expect(() => assertPortalRole(user(), 'SUPER_ADMIN')).toThrow('Unauthorized role')
  })
})

describe('completeSecondFactor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('consumes a pending emailed code that matches and is not expired, and stamps the login', async () => {
    const pending = user({ emailOtpCode: '123456', emailOtpExpires: new Date(now.getTime() + 60_000) })
    await completeSecondFactor(pending, '123456')
    expect(update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { emailOtpCode: null, emailOtpExpires: null, lastLogin: now } })
  })

  it('refuses a missing, wrong or expired emailed code without touching the account', async () => {
    const pending = user({ emailOtpCode: '123456', emailOtpExpires: new Date(now.getTime() + 60_000) })
    await expect(completeSecondFactor(pending, undefined)).rejects.toThrow('Invalid two-factor code')
    await expect(completeSecondFactor(pending, '654321')).rejects.toThrow('Invalid two-factor code')
    const expired = user({ emailOtpCode: '123456', emailOtpExpires: new Date(now.getTime() - 1) })
    await expect(completeSecondFactor(expired, '123456')).rejects.toThrow('Invalid two-factor code')
    expect(update).not.toHaveBeenCalled()
  })

  it('checks an authenticator code against the secret and stamps the login', async () => {
    await completeSecondFactor(user({ totpSecret: secret }), generateSync({ secret }))
    expect(update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { lastLogin: now } })
  })

  it('refuses a missing or wrong authenticator code', async () => {
    await expect(completeSecondFactor(user({ totpSecret: secret }), undefined)).rejects.toThrow('Invalid two-factor code')
    await expect(completeSecondFactor(user({ totpSecret: secret }), '000000')).rejects.toThrow('Invalid two-factor code')
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses credentials alone when no code is pending and there is no authenticator: the emailed code is not optional', async () => {
    await expect(completeSecondFactor(user(), undefined)).rejects.toThrow('Two-factor code required')
    await expect(completeSecondFactor(user(), '123456')).rejects.toThrow('Two-factor code required')
    expect(update).not.toHaveBeenCalled()
  })

  it('stamps the login on the password alone when the second factor is off, whatever the account carries', async () => {
    await completeSecondFactor(user({ mfaEnabled: false }), undefined)
    expect(update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { lastLogin: now } })
    // a stale code or a secret does not bring the factor back
    const stale = user({ mfaEnabled: false, emailOtpCode: '123456', emailOtpExpires: new Date(now.getTime() + 60_000), totpSecret: secret })
    await completeSecondFactor(stale, undefined)
    expect(update).toHaveBeenCalledTimes(2)
    expect(update).toHaveBeenLastCalledWith({ where: { id: 'u1' }, data: { lastLogin: now } })
  })
})
