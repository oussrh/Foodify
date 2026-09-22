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
