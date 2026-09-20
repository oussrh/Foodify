import { afterEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn(async () => ({ data: { id: 'm1' }, error: null }))
vi.mock('resend', () => ({ Resend: class { emails = { send } } }))

async function load(vars: Record<string, string>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v)
  return import('./mail')
}

describe('sendMail', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    send.mockClear()
  })

  it('sends from the configured sender when a key is set', async () => {
    const { sendMail } = await load({ DATABASE_URL: 'postgresql://x', RESEND_API_KEY: 're_1', RESEND_FROM: 'Foodify <no-reply@foodify.test>' })
    await expect(sendMail({ to: 'a@b.c', subject: 'Hi', html: '<p>Hi</p>' })).resolves.toEqual({ sent: true })
    expect(send).toHaveBeenCalledWith({ from: 'Foodify <no-reply@foodify.test>', to: 'a@b.c', subject: 'Hi', html: '<p>Hi</p>' })
  })

  it('sends nothing without a key and says so', async () => {
    const { sendMail } = await load({ DATABASE_URL: 'postgresql://x', RESEND_API_KEY: '', RESEND_FROM: '' })
    await expect(sendMail({ to: 'a@b.c', subject: 'Hi', html: '' })).resolves.toEqual({ sent: false })
    expect(send).not.toHaveBeenCalled()
  })
})
