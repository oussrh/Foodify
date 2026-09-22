import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { brevoSms } = vi.hoisted(() => ({ brevoSms: { current: null as { apiKey: string; sender: string } | null } }))
vi.mock('@/lib/env', () => ({
  publicEnv: { isTest: true, isProduction: false },
  serverEnv: {
    get brevoSms() {
      return brevoSms.current
    },
  },
}))

import { sendSms } from './sms'

describe('sendSms', () => {
  beforeEach(() => {
    brevoSms.current = { apiKey: 'key-123', sender: 'Foodify' }
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('sends nothing and says so while the account is not linked', async () => {
    brevoSms.current = null
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendSms({ to: '+212600000000', text: 'Order #1' })).toEqual({ sent: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the message to Brevo with the key and the sender from the environment', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendSms({ to: '+212600000000', text: 'Order #7 received' })).toEqual({ sent: true })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/transactionalSMS/sms')
    expect((init.headers as Record<string, string>)['api-key']).toBe('key-123')
    expect(JSON.parse(init.body as string)).toEqual({
      sender: 'Foodify',
      recipient: '+212600000000',
      content: 'Order #7 received',
      type: 'transactional',
    })
  })

  it('reports a refusal and a failed request as "nothing sent" rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"code":"invalid_parameter"}', { status: 400 })))
    expect(await sendSms({ to: '+212600000000', text: 'Order #1' })).toEqual({ sent: false })
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down')
    }))
    expect(await sendSms({ to: '+212600000000', text: 'Order #1' })).toEqual({ sent: false })
  })
})
