// lib/change-log.ts
// A bill's change log as a manager reads it: who did what to which dish, when, and why. The rows
// are OrderChange (every cancel, removal, void, close, merge, undo and move); this turns one into
// the sentence the order's details show. Client-safe.
import { REASON_LABEL, type ChangeReason } from '@/lib/bill-rules'

/** One change as the details sheet lists it: plain JSON, the people named by their sign-in name. */
export interface ChangeLogEntry {
  id: string
  kind: 'CANCEL' | 'REMOVE' | 'VOID' | 'CLOSE' | 'MERGE' | 'UNMERGE' | 'MOVE'
  status: 'APPLIED' | 'PENDING' | 'REFUSED'
  /** The dish, as it was ordered, for a removal or a void of one line. */
  dish: string | null
  quantity: number | null
  reason: ChangeReason | null
  note: string | null
  fromTable: string | null
  toTable: string | null
  /** The number of the other bill of a merge or an undo. */
  mergedNumber: number | null
  /** Who asked or did it, and who answered a request; null once the account is gone. */
  by: string | null
  decidedBy: string | null
  createdAt: string
  decidedAt: string | null
}

/** The dish and how many, or "the order" for a change to a whole ticket. */
const what = (entry: ChangeLogEntry) => (entry.dish === null ? 'the order' : `${entry.quantity ?? 1} ${entry.dish}`)
/** Whether a cancel or a removal went through, or was only asked for. */
const asked = (entry: ChangeLogEntry) => (entry.status === 'APPLIED' ? '' : 'Asked to ')
const other = (entry: ChangeLogEntry) => `#${entry.mergedNumber ?? '?'}`

const HEADLINE: Record<ChangeLogEntry['kind'], (entry: ChangeLogEntry) => string> = {
  CANCEL: (entry) => (asked(entry) ? 'Asked to cancel the order' : 'Cancelled the order'),
  REMOVE: (entry) => (asked(entry) ? `Asked to remove ${what(entry)}` : `Removed ${what(entry)}`),
  VOID: (entry) => `Voided ${what(entry)}`,
  CLOSE: (entry) => (entry.quantity ? `Closed the bill with ${entry.quantity} still in the kitchen` : 'Closed the bill'),
  MERGE: (entry) => `Merged with ${other(entry)}`,
  UNMERGE: (entry) => `Split ${other(entry)} off again`,
  MOVE: (entry) => `Moved from table ${entry.fromTable ?? '?'} to ${entry.toTable ?? '?'}`,
}

/** What was done, in a few words: "Removed 1 Tea", "Asked to cancel the order", "Moved from table 3 to 5". */
export function changeHeadline(entry: ChangeLogEntry): string {
  return HEADLINE[entry.kind](entry)
}

/** Why, when a reason was given: the reason's label, and the note after it. */
export function changeWhy(entry: Pick<ChangeLogEntry, 'reason' | 'note'>): string | null {
  if (!entry.reason) return null
  return entry.note ? `${REASON_LABEL[entry.reason]}: ${entry.note}` : REASON_LABEL[entry.reason]
}

/** How a request was answered, for a request; null for a change applied as it was made. */
export function changeAnswer(entry: Pick<ChangeLogEntry, 'status' | 'decidedBy' | 'decidedAt'>): string | null {
  if (entry.status === 'PENDING') return 'Waiting for the kitchen'
  if (!entry.decidedAt) return null
  const who = entry.decidedBy ?? 'the kitchen'
  return entry.status === 'REFUSED' ? `Refused by ${who}` : `Accepted by ${who}`
}
