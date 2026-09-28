// lib/print/job-rules.ts
// What becomes of a print job after the printer answers, or does not. A job printed is done. A job
// the printer could not print because of itself (out of paper, cover open) waits, without using
// an attempt, until someone fixes it: that is the printer's state, not the job's fault. Any other
// failure uses an attempt, and the job fails for good after MAX_ATTEMPTS. A job handed out that
// the printer never answered for is handed out again after SENT_LEASE_MS: a kitchen would rather
// have the same ticket twice than lose one.

/** How many jobs one poll takes away: a burst of orders prints over a few polls, never in one huge answer. */
export const JOBS_PER_POLL = 10
/** How long a job handed to a printer waits for its result before it is handed out again. */
export const SENT_LEASE_MS = 2 * 60_000
/** Attempts before a job fails for good; Reprint puts it back. */
export const MAX_ATTEMPTS = 5

/** Epson's codes for a printer that needs a person, and what to tell them. */
const CONDITIONS: Record<string, string> = {
  EPTR_REC_EMPTY: 'Out of paper',
  EPTR_COVER_OPEN: 'Cover open',
  EPTR_CUTTER: 'Paper jammed in the cutter',
}

/** Epson's other codes worth saying in words. */
const FAULTS: Record<string, string> = {
  EPTR_MECHANICAL: 'Mechanical fault: turn the printer off and on',
  EPTR_AUTOMATICAL: 'The printer stopped: turn it off and on',
  EPTR_UNRECOVERABLE: 'The printer stopped: turn it off and on',
  EX_TIMEOUT: 'The printer took too long',
  SchemaError: 'The printer could not read the ticket',
  DeviceNotFound: 'The printer could not find its print head (check its ePOS settings)',
}

/** A code as the owner reads it. */
export function codeMessage(code: string): string {
  return CONDITIONS[code] ?? FAULTS[code] ?? (code ? `Printer error ${code}` : 'Printer error')
}

/** Where a job goes after the printer's result, having used `attempts` so far (this one included). */
export function afterResult(success: boolean, code: string, attempts: number): 'PRINTED' | 'WAIT' | 'RETRY' | 'FAILED' {
  if (success) return 'PRINTED'
  if (code in CONDITIONS) return 'WAIT'
  return attempts >= MAX_ATTEMPTS ? 'FAILED' : 'RETRY'
}
