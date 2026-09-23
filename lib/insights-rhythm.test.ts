import { describe, expect, it } from 'vitest'
import { activeHours, hourLabel, peakOf, rhythmGrid } from './insights-rhythm'

describe('rhythmGrid', () => {
  it('puts each count at its ISO weekday (Monday first) and hour, zero elsewhere', () => {
    const grid = rhythmGrid([
      { dow: 1, hour: 12, count: 3 },
      { dow: 7, hour: 20, count: 5 },
    ])
    expect(grid).toHaveLength(7)
    expect(grid.every((day) => day.length === 24)).toBe(true)
    expect(grid[0]![12]).toBe(3)
    expect(grid[6]![20]).toBe(5)
    expect(grid.flat().reduce((a, b) => a + b, 0)).toBe(8)
  })

  it('drops a row outside the week or the day rather than writing past the grid', () => {
    const grid = rhythmGrid([
      { dow: 0, hour: 1, count: 9 },
      { dow: 3, hour: 24, count: 9 },
    ])
    expect(grid.flat().every((n) => n === 0)).toBe(true)
  })
})

describe('peakOf', () => {
  it('is the busiest cell, the earliest on a tie', () => {
    const grid = rhythmGrid([
      { dow: 5, hour: 20, count: 7 },
      { dow: 6, hour: 13, count: 7 },
      { dow: 2, hour: 9, count: 1 },
    ])
    expect(peakOf(grid)).toEqual({ day: 4, hour: 20, count: 7 })
  })

  it('is null for a quiet week', () => {
    expect(peakOf(rhythmGrid([]))).toBeNull()
  })
})

describe('activeHours', () => {
  it('spans the first to the last busy hour', () => {
    const grid = rhythmGrid([
      { dow: 1, hour: 11, count: 1 },
      { dow: 4, hour: 23, count: 1 },
    ])
    expect(activeHours(grid)).toEqual({ from: 11, to: 23 })
  })

  it('widens a short service to eight hours, without leaving the day', () => {
    expect(activeHours(rhythmGrid([{ dow: 1, hour: 12, count: 1 }]))).toEqual({ from: 9, to: 16 })
    expect(activeHours(rhythmGrid([{ dow: 1, hour: 0, count: 1 }]))).toEqual({ from: 0, to: 7 })
    expect(activeHours(rhythmGrid([{ dow: 1, hour: 23, count: 1 }]))).toEqual({ from: 16, to: 23 })
  })

  it('draws the whole day when nothing happened', () => {
    expect(activeHours(rhythmGrid([]))).toEqual({ from: 0, to: 23 })
  })
})

describe('hourLabel', () => {
  it('writes an hour as a timetable does', () => {
    expect(hourLabel(9)).toBe('09:00')
    expect(hourLabel(21)).toBe('21:00')
  })
})
