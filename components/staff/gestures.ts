// components/staff/gestures.ts
// Some things a browser grants only inside a tap: audio that may play, and on some iOS versions a
// screen that may stay awake. After a reload nobody has tapped yet, so a setting remembered as
// "on" cannot act until someone does. These are the events a browser counts as that tap (HTML's
// activation-triggering events: a touch activates on the way up, not on the way down, and
// Safari's own gesture is `touchend`), listened for on the whole page, in the capture phase so a
// control that stops propagation cannot swallow it.

const ACTIVATION_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'] as const

/**
 * Calls `run` on every activating gesture anywhere under `target` until the returned function is
 * called. `run` must be idempotent: one tap fires several of these events.
 */
export function listenForGestures(target: EventTarget, run: () => void): () => void {
  for (const type of ACTIVATION_EVENTS) target.addEventListener(type, run, true)
  return () => {
    for (const type of ACTIVATION_EVENTS) target.removeEventListener(type, run, true)
  }
}
