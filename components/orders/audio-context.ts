// components/orders/audio-context.ts
// The page's one audio context, shared by every chime on it. One rather than one per screen,
// because it is the context a gesture unlocks: a waiter who tapped once on the Orders tab and
// walked back to the tables must not find the chime locked again because that screen made a new
// one. It is also a small store — whether the audio is running — so a screen can say "tap to
// enable sound" exactly while it is not: after a reload, after a phone call on iOS
// ("interrupted"), after the tablet slept and the browser suspended it.

type AudioContextClass = typeof AudioContext

let shared: AudioContext | null = null
const listeners = new Set<() => void>()
const notify = () => {
  for (const listener of listeners) listener()
}

/** The browser's AudioContext constructor (prefixed on old Safari); undefined where there is no audio. */
export function audioContextClass(): AudioContextClass | undefined {
  if (typeof window === 'undefined') return undefined
  return window.AudioContext ?? (window as { webkitAudioContext?: AudioContextClass }).webkitAudioContext
}

/**
 * The page's context, opened on first use and asked to resume; null where there is no audio. A
 * resume only succeeds inside a gesture on iOS, or once the page has had one elsewhere, so call
 * this from a tap and let the store report whether it worked.
 */
export function wakeAudio(): AudioContext | null {
  const Ctor = audioContextClass()
  if (!Ctor) return null
  if (!shared) {
    shared = new Ctor()
    shared.addEventListener('statechange', notify)
  }
  void shared.resume().then(notify, () => undefined)
  return shared
}

/** Whether audio can be heard right now: the context exists and is running. */
export function audioRunning(): boolean {
  return shared?.state === 'running'
}

/** Subscribes to `audioRunning` changes, for `useSyncExternalStore`. */
export function subscribeAudio(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
