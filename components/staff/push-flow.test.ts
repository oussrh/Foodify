import { describe, expect, it, vi } from 'vitest'
import { refreshPush, subscriptionInput, turnOffPush, turnOnPush, type PushDeps } from './push-flow'

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123'
const KEYS = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' }
const VAPID = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

/** A browser subscription as `pushManager` hands one back. */
function fakeSubscription(endpoint = ENDPOINT) {
  return { endpoint, toJSON: () => ({ endpoint, keys: KEYS }), unsubscribe: vi.fn(async () => true) }
}

/** A PushManager holding `existing` (or nothing), and the flows' other dependencies as spies. */
function setup(permission: NotificationPermission, existing: ReturnType<typeof fakeSubscription> | null = null) {
  const made = fakeSubscription()
  const pushManager = {
    getSubscription: vi.fn(async () => existing),
    subscribe: vi.fn(async () => made),
  }
  const deps = {
    registration: vi.fn(async () => ({ pushManager })),
    requestPermission: vi.fn(async () => permission),
    save: vi.fn(async () => ({ saved: true })),
    remove: vi.fn(async () => ({ removed: true })),
    vapidKey: VAPID,
  }
  return { deps: deps as unknown as PushDeps & typeof deps, pushManager, made }
}

describe('turnOnPush', () => {
  it('asks before anything else, so the prompt opens inside the tap', () => {
    const { deps } = setup('granted')
    void turnOnPush(deps)
    // Synchronously, before the first await: a prompt requested later is refused by the browser.
    expect(deps.requestPermission).toHaveBeenCalledTimes(1)
    expect(deps.registration).not.toHaveBeenCalled()
  })

  it('subscribes with the VAPID key, visible pushes only, and saves the subscription', async () => {
    const { deps, pushManager } = setup('granted')
    await expect(turnOnPush(deps)).resolves.toEqual({ permission: 'granted', subscribed: true })
    const options = pushManager.subscribe.mock.calls[0] as unknown as [PushSubscriptionOptionsInit]
    expect(options[0].userVisibleOnly).toBe(true)
    expect(options[0].applicationServerKey).toHaveLength(65)
    expect(deps.save).toHaveBeenCalledWith({ endpoint: ENDPOINT, keys: KEYS })
  })

  it('keeps a subscription the device already has rather than making a second', async () => {
    const { deps, pushManager } = setup('granted', fakeSubscription('https://web.push.apple.com/old'))
    await turnOnPush(deps)
    expect(pushManager.subscribe).not.toHaveBeenCalled()
    expect(deps.save).toHaveBeenCalledWith({ endpoint: 'https://web.push.apple.com/old', keys: KEYS })
  })

  it('stops at a refusal or a dismissed prompt, subscribing nothing', async () => {
    for (const answer of ['denied', 'default'] as const) {
      const { deps, pushManager } = setup(answer)
      await expect(turnOnPush(deps)).resolves.toEqual({ permission: answer, subscribed: false })
      expect(pushManager.subscribe).not.toHaveBeenCalled()
      expect(deps.save).not.toHaveBeenCalled()
    }
  })

  it('fails when the worker never becomes ready, so the tap can say so', async () => {
    const { deps } = setup('granted')
    deps.registration.mockRejectedValueOnce(new Error('worker not ready'))
    await expect(turnOnPush(deps)).rejects.toThrow('worker not ready')
  })
})

describe('turnOffPush', () => {
  it('forgets the device on the server before unsubscribing it', async () => {
    const existing = fakeSubscription()
    const { deps } = setup('granted', existing)
    const order: string[] = []
    deps.remove.mockImplementation(async () => (order.push('remove'), { removed: true }))
    existing.unsubscribe.mockImplementation(async () => (order.push('unsubscribe'), true))
    await turnOffPush(deps)
    expect(deps.remove).toHaveBeenCalledWith(ENDPOINT)
    expect(order).toEqual(['remove', 'unsubscribe'])
  })

  it('keeps the subscription when the server could not be told, so the state stays true', async () => {
    const existing = fakeSubscription()
    const { deps } = setup('granted', existing)
    deps.remove.mockRejectedValueOnce(new Error('offline'))
    await expect(turnOffPush(deps)).rejects.toThrow('offline')
    expect(existing.unsubscribe).not.toHaveBeenCalled()
  })

  it('does nothing on a device that is not subscribed', async () => {
    const { deps } = setup('granted')
    await turnOffPush(deps)
    expect(deps.remove).not.toHaveBeenCalled()
  })
})

describe('refreshPush', () => {
  it('saves an existing subscription again on load, because endpoints rotate', async () => {
    const { deps } = setup('granted', fakeSubscription())
    await expect(refreshPush(deps)).resolves.toBe(true)
    expect(deps.save).toHaveBeenCalledWith({ endpoint: ENDPOINT, keys: KEYS })
  })

  it('saves an endpoint once per page load for the same restaurant and app, however often the screen mounts', async () => {
    const { deps } = setup('granted', fakeSubscription())
    const keyed = { ...deps, saveKey: 'r1:waiter' }
    await refreshPush(keyed)
    await refreshPush(keyed)
    expect(deps.save).toHaveBeenCalledTimes(1)
    await refreshPush({ ...keyed, saveKey: 'r2:waiter' })
    expect(deps.save).toHaveBeenCalledTimes(2)
  })

  it('reports a device with no subscription as off and saves nothing', async () => {
    const { deps } = setup('granted')
    await expect(refreshPush(deps)).resolves.toBe(false)
    expect(deps.save).not.toHaveBeenCalled()
  })
})

describe('subscriptionInput', () => {
  it('refuses a subscription the browser gave without its keys', () => {
    expect(() => subscriptionInput({ endpoint: ENDPOINT })).toThrow('without its keys')
    expect(() => subscriptionInput({ endpoint: ENDPOINT, keys: { p256dh: KEYS.p256dh } })).toThrow('without its keys')
  })
})
