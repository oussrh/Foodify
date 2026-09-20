// lib/device.ts
// What kind of device the browser runs on, from the user agent. Read only on the client (the
// callers go through useClientValue); a test stubs `navigator`.

/** iPhone, iPad or iPod. The MSStream check excludes the old IE mobile UA that spoofed iOS. */
export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !('MSStream' in window)
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
}
