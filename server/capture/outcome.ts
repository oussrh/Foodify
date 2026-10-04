// server/capture/outcome.ts
// What a capture call answers (`CaptureOutcome`), and the two answers several calls share.

/** A write's answer: done, with what it made, or why not in words for the manager. */
export type CaptureOutcome<T> = ({ ok: true } & T) | { ok: false; error: string }

/** The capture is not this restaurant's, or no longer exists. */
export const GONE = { ok: false, error: 'That capture is no longer here. Refresh the page.' } as const

/** The capture changed under this call (another tab put it aside, accepted or started it). */
export const MOVED_ON = { ok: false, error: 'This capture was changed meanwhile, in another tab or by someone else. Nothing was done.' } as const
