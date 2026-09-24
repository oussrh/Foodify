import { describe, expect, it } from 'vitest'
import { pushEndpointInput, pushSubscriptionInput } from './push'
import { parse as legacyParse } from 'node:url'

const restaurantId = '11111111-1111-4111-8111-111111111111'
// The shapes browsers really send: an 87-character p256dh and a 22-character auth.
const keys = { p256dh: `B${'a'.repeat(86)}`, auth: 'c2VjcmV0LWF1dGgta2V5MQ' }
const input = (endpoint: string, extra: Partial<typeof keys> = {}) => ({
  restaurantId,
  app: 'board',
  subscription: { endpoint, keys: { ...keys, ...extra } },
})
const accepts = (endpoint: string) => pushEndpointInput.safeParse({ endpoint }).success

describe('the push endpoint', () => {
  it('accepts each browser push service the staff apps run on', () => {
    // Stated here rather than read from the module, so a host dropped from the list fails a test.
    for (const endpoint of [
      'https://fcm.googleapis.com/fcm/send/abc:APA91b',
      'https://android.googleapis.com/gcm/send/abc',
      'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
      'https://eu.push.services.mozilla.com/wpush/v2/gAAAA',
      'https://web.push.apple.com/QGx3',
      'https://api.push.apple.com/3/device/x',
      'https://wns2-par02p.notify.windows.com/w/?token=BQYAAA',
    ]) {
      expect(accepts(endpoint), endpoint).toBe(true)
    }
  })

  it('refuses a host that only looks like one: the server would POST to it', () => {
    for (const endpoint of [
      'https://fcm.googleapis.com.evil.example/fcm/send/x',
      'https://evilfcm.googleapis.com/x',
      'https://storage.googleapis.com/bucket/x',
      'https://evilpush.apple.com/x',
      'https://push.apple.com.evil.example/x',
      'https://notify.windows.com.attacker.net/x',
      'https://evil.example/fcm.googleapis.com',
      'https://127.0.0.1/x',
      'https://localhost/x',
    ]) {
      expect(accepts(endpoint), endpoint).toBe(false)
    }
  })

  it('refuses a host the sending library would read differently from this check', () => {
    // web-push sends with Node's legacy url.parse; each of these is a push service to WHATWG URL
    // and another host to url.parse, which is where the POST would go.
    for (const endpoint of [
      'https://evil.com;.push.apple.com/x',
      'https://evil.com%2e.push.apple.com/x',
      'https://169.254.169.254;.push.apple.com/latest',
      'https://evil.com\\.push.apple.com/x',
      'https://fcm.googleapis.com:443/x',
    ]) {
      expect(accepts(endpoint), endpoint).toBe(false)
    }
  })

  it('accepts only endpoints both parsers read as the same push host', () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/abc:APA91b-x_y'
    expect(accepts(endpoint)).toBe(true)
    expect(legacyParse(endpoint).hostname).toBe(new URL(endpoint).hostname)
  })

  it('refuses plain http, another port, credentials in the address and a non-URL', () => {
    expect(accepts('http://fcm.googleapis.com/fcm/send/x')).toBe(false)
    expect(accepts('https://fcm.googleapis.com:8443/fcm/send/x')).toBe(false)
    expect(accepts('https://user:pass@fcm.googleapis.com/fcm/send/x')).toBe(false)
    expect(accepts('fcm.googleapis.com/fcm/send/x')).toBe(false)
    expect(accepts(`https://fcm.googleapis.com/${'x'.repeat(2048)}`)).toBe(false)
  })
})

describe('pushSubscriptionInput', () => {
  it('takes a browser subscription for one of the two staff apps', () => {
    expect(pushSubscriptionInput.parse(input('https://fcm.googleapis.com/fcm/send/abc')).app).toBe('board')
    expect(pushSubscriptionInput.safeParse({ ...input('https://fcm.googleapis.com/fcm/send/abc'), app: 'waiter' }).success).toBe(true)
  })

  it('refuses an app it does not know, and a restaurant that is not an id', () => {
    expect(pushSubscriptionInput.safeParse({ ...input('https://fcm.googleapis.com/x'), app: 'kitchen' }).success).toBe(false)
    expect(pushSubscriptionInput.safeParse({ ...input('https://fcm.googleapis.com/x'), restaurantId: 'K7M2QX' }).success).toBe(false)
  })

  it('refuses keys that are not base64url, or far longer than a key can be', () => {
    const ok = 'https://fcm.googleapis.com/x'
    expect(pushSubscriptionInput.safeParse(input(ok, { auth: 'not base64url!!!!!!' })).success).toBe(false)
    expect(pushSubscriptionInput.safeParse(input(ok, { p256dh: 'A'.repeat(129) })).success).toBe(false)
    expect(pushSubscriptionInput.safeParse(input(ok, { auth: 'short' })).success).toBe(false)
    // Padding is tolerated: some encoders add it, and it changes nothing about the key.
    expect(pushSubscriptionInput.safeParse(input(ok, { auth: 'c2VjcmV0LWF1dGgta2V5MQ==' })).success).toBe(true)
  })
})
