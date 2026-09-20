import { afterEach, describe, expect, it, vi } from 'vitest'

// The session and the user row stand in; redirect() throws as Next's does.
const { auth, findUnique, redirect } = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`)
  }),
}))
vi.mock('@/auth', () => ({ auth }))
vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique } } }))
vi.mock('next/navigation', () => ({ redirect }))

import { requireSuperAdminPage } from './auth-guard'

describe('requireSuperAdminPage', () => {
  afterEach(() => vi.clearAllMocks())

  it('sends a page with no session to the login', async () => {
    auth.mockResolvedValueOnce(null)
    await expect(requireSuperAdminPage()).rejects.toThrow('NEXT_REDIRECT:/admin/login')
  })

  it('sends a session whose user is gone to the login, whatever the token still says', async () => {
    auth.mockResolvedValueOnce({ user: { id: 'u1', email: 'gone@x', role: 'SUPER_ADMIN' } })
    findUnique.mockResolvedValueOnce(null)
    await expect(requireSuperAdminPage()).rejects.toThrow('NEXT_REDIRECT:/admin/login')
  })

  it('sends a restaurant admin to the manager portal and anyone else to the root', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', email: 'a@x' } })
    findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@x', role: 'RESTAURANT_ADMIN' })
    await expect(requireSuperAdminPage()).rejects.toThrow('NEXT_REDIRECT:/manager')
    findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@x', role: 'SOMETHING_ELSE' })
    await expect(requireSuperAdminPage()).rejects.toThrow('NEXT_REDIRECT:/')
  })

  it('returns the fresh row of a super admin', async () => {
    auth.mockResolvedValueOnce({ user: { id: 'u1', email: 'a@x' } })
    findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@x', role: 'SUPER_ADMIN' })
    await expect(requireSuperAdminPage()).resolves.toEqual({ id: 'u1', email: 'a@x', role: 'SUPER_ADMIN' })
    expect(redirect).not.toHaveBeenCalled()
  })

  it('lets a failure that is not an authorisation one through to the error boundary', async () => {
    auth.mockRejectedValueOnce(new Error('session store down'))
    await expect(requireSuperAdminPage()).rejects.toThrow('session store down')
    expect(redirect).not.toHaveBeenCalled()
  })
})
