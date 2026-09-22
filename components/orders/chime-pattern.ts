// components/orders/chime-pattern.ts
// What a new order sounds like. A kitchen is a loud room and nobody is watching the tablet, so
// the alert has to carry — but it rings all day, so it has to be worth hearing. It is a rising
// major arpeggio (C, E, G, C an octave up) answered by a softer echo of its last three notes:
// the notes overlap and ring on, which reads as a bell rather than an alarm. The schedule is
// plain data here and `use-chime` gives it its voice, so the tune can be read and tested
// without an audio context.

/** One note of the alert: when it starts (seconds from the first), its pitch in hertz, how long it rings, and how loud against the others. */
export interface ChimeNote {
  startsIn: number
  frequency: number
  duration: number
  level: number
}

/** C6, E6, G6 and C7: a major triad and its octave, the shape a doorbell or a ship's bell uses. */
const ARPEGGIO = [1046.5, 1318.51, 1567.98, 2093] as const
/** The gap between one note of a phrase and the next; short enough that they ring together. */
const NOTE_GAP = 0.22
/** How long a note rings. Far longer than the gap, so the phrase becomes a chord rather than a sequence of beeps. */
const RING = 1.7
/** When the answering phrase begins, and how loud it is against the first. */
const ECHO_AT = 1.3
const ECHO_LEVEL = 0.72

/** Every note of the alert, in order: the rising arpeggio, then its last three notes again, softer. */
export function chimeNotes(): ChimeNote[] {
  const phrase = ARPEGGIO.map((frequency, index) => ({
    startsIn: index * NOTE_GAP,
    frequency,
    duration: RING,
    level: 1,
  }))
  const echo = ARPEGGIO.slice(1).map((frequency, index) => ({
    startsIn: ECHO_AT + index * NOTE_GAP,
    frequency,
    duration: RING,
    level: ECHO_LEVEL,
  }))
  return [...phrase, ...echo]
}

/** How long the whole alert lasts, from the first note to the last one fading out. */
export function chimeSeconds(): number {
  return Math.max(...chimeNotes().map((note) => note.startsIn + note.duration))
}

/**
 * The waiter's phone says something different, on purpose. Both alerts can be audible in the
 * same room, and two apps that sound alike are two apps nobody can tell apart across a dining
 * room — so this is lower than the kitchen's arpeggio, falls instead of rising, and is over in
 * about a second. A rising phrase summons; a falling one informs, and informing is all this does.
 * It is also quieter, because it rings a metre from a table of guests rather than across a line.
 */
const WAITER_FALL = [880, 659.25] as const
const WAITER_GAP = 0.16
const WAITER_RING = 0.9

/** Two notes, A5 down to E5: a falling fourth, the shape of a soft notification rather than a bell. */
export function waiterChimeNotes(): ChimeNote[] {
  return WAITER_FALL.map((frequency, index) => ({
    startsIn: index * WAITER_GAP,
    frequency,
    duration: WAITER_RING,
    level: index === 0 ? 1 : 0.85,
  }))
}

/** A tune and how loud to ring it; `useChime` takes one of these. */
export interface ChimeVoice {
  notes: ChimeNote[]
  /** The bus gain before the compressor. A kitchen carries; a dining room does not want to. */
  volume: number
}

/** The board's alert: loud enough to cross a kitchen. */
export const KITCHEN_CHIME: ChimeVoice = { notes: chimeNotes(), volume: 0.85 }
/** The waiter's: quieter, lower and shorter, so it is heard by the person holding the phone. */
export const WAITER_CHIME: ChimeVoice = { notes: waiterChimeNotes(), volume: 0.45 }
