// lib/tracking-poll.ts
// The decisions of the guest's order poll (components/menu/tracking/use-order-tracking.ts), as a
// pure state machine so each is tested without a browser: when to ask, what an answer does to
// what is on screen, when to stop for good, when to forget the secret and when to buzz. Answers
// are numbered by the request that asked, and one older than the last applied is dropped, so a
// slow early answer can never undo a later one. Client-safe.
import { ApiError } from '@/lib/api-client'
import { isFinished } from '@/lib/guest-status'
import type { TrackedOrder } from '@/lib/schemas/order-tracking'

/** What the poll knows. `seq` is the request number of the last answer applied. */
export interface PollState {
  seq: number
  order: TrackedOrder | null
  /** False after a request that got no usable answer (no network, a 5xx). */
  online: boolean
  /** The server said it does not know this secret. */
  gone: boolean
  /**
   * A 200 this page cannot read: the server was deployed ahead of (or behind) this page. Asking
   * again would get the same body, so the poll stops and the guest is asked to reload, which
   * fetches the page that matches the server; the last good answer stays on screen meanwhile.
   */
  outdated: boolean
  /** Nothing more to ask: served, cancelled, the bill closed, unknown, or outdated. */
  done: boolean
  /** The phone has buzzed for this order's call-up; it never buzzes twice. */
  buzzed: boolean
}

/** What one request came to, numbered by when it was sent. */
export type PollAnswer = { seq: number } & ({ kind: 'order'; order: TrackedOrder } | { kind: 'not_found' } | { kind: 'failed' } | { kind: 'unreadable' })

/** What applying an answer asks the caller to do besides showing the new state. */
export interface PollEffects {
  state: PollState
  /** The order just read, for the device's list to record; null when there is none. */
  heard: TrackedOrder | null
  /** Forget the secret on this device: the server said, in its own words, that it is unknown. */
  forget: boolean
  buzz: boolean
}

/** Before the first answer. */
export const POLL_START: PollState = { seq: 0, order: null, online: true, gone: false, outdated: false, done: false, buzzed: false }

/** Whether there is nothing more to follow: served, cancelled, or the table's bill closed. */
export function isOver(order: Pick<TrackedOrder, 'status' | 'closed'>): boolean {
  return isFinished(order.status) || order.closed
}

/** Whether to send a request now: not while one is in flight, the page is hidden, or the poll is done. */
export function shouldPoll(state: PollState, visible: boolean, inFlight: boolean): boolean {
  return visible && !inFlight && !state.done
}

/**
 * What a failed request was. Only the endpoint's own `not_found` means the secret is unknown; any
 * other 404 (a page from another deploy asking a route that moved) must not cost the guest the
 * only copy of their secret, and reads as a failure to be retried like any other.
 */
export function failureOf(error: unknown): 'not_found' | 'failed' {
  return error instanceof ApiError && error.status === 404 && error.code === 'not_found' ? 'not_found' : 'failed'
}

const NONE = { heard: null, forget: false, buzz: false }

/** The state after `answer`, and what to do about it; an answer older than the last applied changes nothing. */
export function applyAnswer(state: PollState, answer: PollAnswer): PollEffects {
  if (answer.seq <= state.seq || state.done) return { state, ...NONE }
  const seq = answer.seq
  if (answer.kind === 'failed') return { state: { ...state, seq, online: false }, ...NONE }
  if (answer.kind === 'unreadable') return { state: { ...state, seq, online: true, outdated: true, done: true }, ...NONE }
  if (answer.kind === 'not_found') return { state: { ...state, seq, online: true, gone: true, done: true }, heard: null, forget: true, buzz: false }
  const { order } = answer
  // Buzz on the move to ready as this page saw it: not when it opens on an order already up.
  const buzz = order.status === 'READY' && state.order !== null && state.order.status !== 'READY' && !state.buzzed
  const next: PollState = { ...state, seq, order, online: true, done: isOver(order), buzzed: state.buzzed || buzz }
  return { state: next, heard: order, forget: false, buzz }
}
