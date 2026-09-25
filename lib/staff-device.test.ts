import { describe, expect, it } from 'vitest'
import { installInvitation, isAppleMobile, launchScreenDue, pushAvailability, urlBase64ToUint8Array, type PushFacts } from './staff-device'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'

describe('isAppleMobile', () => {
  it('knows an iPhone by its user agent', () => {
    expect(isAppleMobile({ userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 })).toBe(true)
  })

  it('knows an iPad asking for the desktop site: a Mac with a touch screen', () => {
    expect(isAppleMobile({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true)
  })

  it('leaves a real Mac and an Android phone alone', () => {
    expect(isAppleMobile({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false)
    expect(isAppleMobile({ userAgent: ANDROID, platform: 'Linux armv8l', maxTouchPoints: 5 })).toBe(false)
  })
})

describe('urlBase64ToUint8Array', () => {
  it('reads unpadded base64url, the alphabet VAPID keys are published in', () => {
    // 0xfb 0xff 0xbf is "+/+/" in base64 and "-_-_" in base64url; two bytes need one "=" of padding.
    expect(Array.from(urlBase64ToUint8Array('-_-_'))).toEqual([0xfb, 0xff, 0xbf])
    expect(Array.from(urlBase64ToUint8Array('AQI'))).toEqual([1, 2])
    expect(Array.from(urlBase64ToUint8Array('AQ'))).toEqual([1])
  })

  it('gives a 65-byte point for a P-256 public key', () => {
    const key = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
    expect(urlBase64ToUint8Array(key)).toHaveLength(65)
  })
})

const ready: PushFacts = { production: true, configured: true, appleMobile: false, standalone: false, pushApi: true, permission: 'default', subscribed: false }

describe('pushAvailability', () => {
  it('says why nothing can be pushed before asking anything of the person', () => {
    expect(pushAvailability({ ...ready, production: false })).toBe('development')
    expect(pushAvailability({ ...ready, configured: false })).toBe('unconfigured')
  })

  it('sends an iPhone in Safari to the home screen first, and an installed old one to an update', () => {
    const iphone = { ...ready, appleMobile: true, pushApi: false }
    expect(pushAvailability(iphone)).toBe('install-first')
    expect(pushAvailability({ ...iphone, standalone: true })).toBe('update-ios')
  })

  it('calls any other browser without the Push API unsupported', () => {
    expect(pushAvailability({ ...ready, pushApi: false })).toBe('unsupported')
  })

  it('follows the permission, then whether this device is subscribed', () => {
    expect(pushAvailability(ready)).toBe('ask')
    expect(pushAvailability({ ...ready, permission: 'denied' })).toBe('denied')
    expect(pushAvailability({ ...ready, permission: 'granted' })).toBe('off')
    expect(pushAvailability({ ...ready, permission: 'granted', subscribed: true })).toBe('on')
  })
})

describe('launchScreenDue', () => {
  it('opens an installed app on the launch screen once a session, and never a browser tab', () => {
    expect(launchScreenDue({ installed: true, seenThisSession: false })).toBe(true)
    expect(launchScreenDue({ installed: true, seenThisSession: true })).toBe(false)
    expect(launchScreenDue({ installed: false, seenThisSession: false })).toBe(false)
  })
})

describe('installInvitation', () => {
  const base = { installed: false, dismissed: false, canInstall: false, appleMobile: false }

  it("offers the browser's prompt where there is one, and Safari's steps on an iPhone or iPad", () => {
    expect(installInvitation({ ...base, canInstall: true })).toBe('prompt')
    expect(installInvitation({ ...base, appleMobile: true })).toBe('share-steps')
  })

  it('says nothing once installed or dismissed, or where the browser offers no way in', () => {
    expect(installInvitation({ ...base, canInstall: true, installed: true })).toBeNull()
    expect(installInvitation({ ...base, appleMobile: true, dismissed: true })).toBeNull()
    expect(installInvitation(base)).toBeNull()
  })
})
