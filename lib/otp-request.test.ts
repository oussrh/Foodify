import bcrypt from 'bcryptjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callArgs } from '@/test/mock-calls'

type Update = { where: { id: string }; data: { emailOtpCode: string; emailOtpExpires: Date } }
// vi.mock is hoisted above these, so the stand-ins come from vi.hoisted.
const { findFirst, update, sendMail } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn<(args: Update) => Promise<object>>(async () => ({})),
  sendMail: vi.fn(async () => ({ sent: true })),
}))
vi.mock('@/lib/prisma', () => ({ default: { user: { findFirst, update } } }))
vi.mock('@/lib/mail', () => ({ sendMail }))

import { OTP_TTL_MS, requestOtp } from './otp-request'

const portal = {
  role: 'RESTAURANT_ADMIN' as const,
  subject: 'Your code',
  html: (code: string) => `<b>${code}</b>`,
  text: (code: string) => `code ${code}`,
  failure: 'Something went wrong. Please try again.',
}
const credentials = { email: 'owner@foodify.test', password: 'correct horse' }
let passwordHash = ''

describe('requestOtp', () => {
  beforeEach(async () => {
    passwordHash = await bcrypt.hash(credentials.password, 4)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('answers the one message for an unknown account, a wrong portal and a wrong password alike', async () => {
    findFirst.mockResolvedValueOnce(null)
    expect(await requestOtp(credentials, portal)).toEqual({ error: 'Invalid email or password' })
    findFirst.mockResolvedValueOnce({ id: 'u1', role: 'SUPER_ADMIN', passwordHash, mfaEnabled: true, email: credentials.email })
    expect(await requestOtp(credentials, portal)).toEqual({ error: 'Invalid email or password' })
    findFirst.mockResolvedValueOnce({ id: 'u1', role: 'RESTAURANT_ADMIN', passwordHash, mfaEnabled: true, email: credentials.email })
    expect(await requestOtp({ ...credentials, password: 'wrong' }, portal)).toEqual({ error: 'Invalid email or password' })
    expect(update).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('stores a six-digit code for ten minutes and mails it in the portal\'s words when the second factor is on', async () => {
    findFirst.mockResolvedValueOnce({ id: 'u1', role: 'RESTAURANT_ADMIN', passwordHash, mfaEnabled: true, email: credentials.email })
    expect(await requestOtp(credentials, portal)).toEqual({ success: true, mfa: true })
    const [call] = callArgs(update)
    expect(call.where).toEqual({ id: 'u1' })
    expect(call.data.emailOtpCode).toMatch(/^[0-9]{6}$/)
    expect(call.data.emailOtpExpires.getTime()).toBe(Date.now() + OTP_TTL_MS)
    expect(sendMail).toHaveBeenCalledWith({ to: credentials.email, subject: 'Your code', html: `<b>${call.data.emailOtpCode}</b>`, text: `code ${call.data.emailOtpCode}` })
  })

  it('stores and sends nothing when the second factor is off, and says the credentials open the session now', async () => {
    findFirst.mockResolvedValueOnce({ id: 'u1', role: 'RESTAURANT_ADMIN', passwordHash, mfaEnabled: false, email: credentials.email })
    expect(await requestOtp(credentials, portal)).toEqual({ success: true, mfa: false })
    expect(update).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('answers the portal\'s failure message when the server, not the caller, fails', async () => {
    findFirst.mockRejectedValueOnce(new Error('connection refused'))
    expect(await requestOtp(credentials, portal)).toEqual({ error: portal.failure })
  })
})
