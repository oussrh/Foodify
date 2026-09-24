import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { password } from '@/lib/schemas/common'
import { staffAccount } from '@/lib/schemas/staff'
import { otpCode } from '@/lib/schemas/user'
import { fieldIssues, firstFieldError, issueOf, parsedOrToast } from './schema-check'

const toastError = vi.hoisted(() => vi.fn())
vi.mock('sonner', () => ({ toast: { error: toastError } }))

describe('schema checks for plain forms', () => {
  beforeEach(() => toastError.mockClear())

  it('keys the first message of each field, and nothing when the value parses', () => {
    expect(fieldIssues(staffAccount, { username: 'k1', password: '123' })).toEqual({
      username: 'A username is at least 3 characters',
      password: 'Password must be at least 6 characters',
    })
    expect(fieldIssues(staffAccount, { username: 'kitchen1', password: '123456' })).toEqual({})
    expect(fieldIssues(z.string(), 1)).toEqual({ '': expect.any(String) })
  })

  it('reads one field as its first message or as nothing', () => {
    expect(issueOf(password, '12')).toBe('Password must be at least 6 characters')
    expect(issueOf(password, '123456')).toBe('')
    expect(issueOf(otpCode, '12345')).toBe('Enter the 6-digit code')
    expect(issueOf(otpCode, '123456')).toBe('')
  })

  it('answers the parsed value, or null after a toast of the first issue', () => {
    expect(parsedOrToast(z.string().trim(), ' a ')).toBe('a')
    expect(toastError).not.toHaveBeenCalled()
    expect(parsedOrToast(password, '1')).toBeNull()
    expect(toastError).toHaveBeenCalledWith('Password must be at least 6 characters')
  })
})

describe('firstFieldError', () => {
  it('names the first field with a message by its label, else by its name', () => {
    const errors = { logoUrl: { message: 'Enter an https:// address' }, name: { message: 'Name is required' } }
    expect(firstFieldError(errors, { logoUrl: 'Logo' })).toBe('Logo: Enter an https:// address')
    expect(firstFieldError(errors)).toBe('logoUrl: Enter an https:// address')
  })

  it('skips an entry without a message and answers null when none has one', () => {
    expect(firstFieldError({ a: {}, b: null, c: { message: 'Too long' } })).toBe('c: Too long')
    expect(firstFieldError({ a: { message: '' } })).toBeNull()
  })
})
