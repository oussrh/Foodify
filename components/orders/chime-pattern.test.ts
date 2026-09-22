import { describe, expect, it } from 'vitest'
import { chimeNotes, chimeSeconds } from './chime-pattern'

describe('chimeNotes', () => {
  it('is a rising arpeggio answered by a softer echo', () => {
    const notes = chimeNotes()
    const phrase = notes.slice(0, 4)
    const echo = notes.slice(4)
    // The phrase climbs, so the alert reads as a call rather than a flat tone.
    for (let i = 1; i < phrase.length; i++) {
      expect(phrase[i]!.frequency).toBeGreaterThan(phrase[i - 1]!.frequency)
    }
    // The echo is the phrase's own notes, quieter: an answer, not a second alarm.
    expect(echo.map((n) => n.frequency)).toEqual(phrase.slice(1).map((n) => n.frequency))
    expect(echo.every((n) => n.level < 1)).toBe(true)
  })

  it('starts at once, and each note begins after the one before it', () => {
    const notes = chimeNotes()
    expect(notes[0]?.startsIn).toBe(0)
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]!.startsIn).toBeGreaterThan(notes[i - 1]!.startsIn)
    }
  })

  it('lets the notes ring into each other rather than sounding one at a time', () => {
    const notes = chimeNotes()
    // Every note is still ringing when the next is struck: that overlap is what makes it a bell.
    for (let i = 1; i < notes.length; i++) {
      const previous = notes[i - 1]!
      expect(notes[i]!.startsIn).toBeLessThan(previous.startsIn + previous.duration)
    }
  })

  // The alert has to survive a noisy kitchen: long enough to be heard from the pass, short enough
  // not to become an alarm. A change that pushes it outside this window is a change of intent.
  it('rings for between two and four seconds', () => {
    expect(chimeSeconds()).toBeGreaterThan(2)
    expect(chimeSeconds()).toBeLessThan(4)
  })
})
