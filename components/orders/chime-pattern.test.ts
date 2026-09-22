import { describe, expect, it } from 'vitest'
import { chimeNotes, chimeSeconds, KITCHEN_CHIME, WAITER_CHIME, waiterChimeNotes } from './chime-pattern'

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

describe('the waiter alert', () => {
  it('falls where the kitchen alert rises: a notification, not a summons', () => {
    const notes = waiterChimeNotes()
    expect(notes).toHaveLength(2)
    expect(notes[1]!.frequency).toBeLessThan(notes[0]!.frequency)
    const kitchen = chimeNotes()
    expect(kitchen[1]!.frequency).toBeGreaterThan(kitchen[0]!.frequency)
  })

  it('sits below the kitchen register, so the two are told apart in one room', () => {
    const highest = (notes: { frequency: number }[]) => Math.max(...notes.map((n) => n.frequency))
    expect(highest(waiterChimeNotes())).toBeLessThan(highest(chimeNotes()))
  })

  it('is over in about a second, where the kitchen rings for three', () => {
    const length = (notes: { startsIn: number; duration: number }[]) => Math.max(...notes.map((n) => n.startsIn + n.duration))
    expect(length(waiterChimeNotes())).toBeLessThan(1.5)
    expect(chimeSeconds()).toBeGreaterThan(2)
  })

  it('rings quieter than the kitchen: a dining room, not a line', () => {
    expect(WAITER_CHIME.volume).toBeLessThan(KITCHEN_CHIME.volume)
  })
})
