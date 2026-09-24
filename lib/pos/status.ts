// lib/pos/status.ts
// Where a connection stands and the moves between those states, stated once for the actions that
// make them and the health panel that names them. Connecting and choosing a location are their
// own actions; these are the owner's switches once it is set up.
import type { PosStatus } from '@/generated/prisma/client'

/** The owner's switches on a set-up connection. */
export type PosMove = 'activate' | 'pause' | 'resume'

/** Which states each switch applies to, and where it leaves the connection. */
const MOVES: Record<PosMove, { from: readonly PosStatus[]; to: PosStatus }> = {
  activate: { from: ['MAPPING'], to: 'ACTIVE' },
  pause: { from: ['ACTIVE'], to: 'PAUSED' },
  resume: { from: ['PAUSED'], to: 'ACTIVE' },
}

/** Where `move` leaves a connection in `status`, or null when it does not apply there. */
export function moveTo(status: PosStatus, move: PosMove): PosStatus | null {
  const rule = MOVES[move]
  return rule.from.includes(status) ? rule.to : null
}

/** Each state in the owner's words. */
export const POS_STATUS_LABEL: Record<PosStatus, string> = {
  NOT_CONNECTED: 'Not connected',
  CONNECTING: 'Choose a location',
  MAPPING: 'Match your dishes',
  ACTIVE: 'Sending',
  PAUSED: 'Paused',
  ERROR: 'Needs attention',
}

/** What the Integrations tab says when the super admin has not switched POS on for a restaurant. */
export const POS_NOT_INCLUDED = 'POS integration isn’t included for this restaurant. Contact support.'

/** What connecting says when this server has no key to seal credentials with. */
export const POS_NOT_CONFIGURED = 'POS integration is not configured on this server'
