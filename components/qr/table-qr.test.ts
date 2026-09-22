import { describe, expect, it } from 'vitest'
import { tableMenuUrl, tableNumbers, tablesCsv } from './table-qr'

describe('tableMenuUrl', () => {
  it('points at the restaurant menu with the table in the query', () => {
    expect(tableMenuUrl('https://foodify.app', 'dar-zitoun', 7)).toBe('https://foodify.app/restaurant/dar-zitoun?table=7')
  })

  it('escapes a label that is not a plain number', () => {
    expect(tableMenuUrl('https://foodify.app', 'dar-zitoun', 'Terrasse 3')).toBe('https://foodify.app/restaurant/dar-zitoun?table=Terrasse%203')
  })
})

describe('tableNumbers', () => {
  it('counts from one', () => {
    expect(tableNumbers(3)).toEqual([1, 2, 3])
  })

  it('prints none for a restaurant that has not said how many tables it has', () => {
    expect(tableNumbers(0)).toEqual([])
    expect(tableNumbers(-4)).toEqual([])
    expect(tableNumbers(Number.NaN)).toEqual([])
  })

  it('stops at the sheet\'s ceiling and ignores a fraction', () => {
    expect(tableNumbers(301)).toHaveLength(300)
    expect(tableNumbers(2.9)).toEqual([1, 2])
  })
})

describe('tablesCsv', () => {
  const restaurant = { name: 'Dar Zitoun', slug: 'dar-zitoun' }
  const ORIGIN = 'https://foodify.app'

  it('writes a header and one row per table, with the link', () => {
    expect(tablesCsv(restaurant, ORIGIN, 2).split('\r\n')).toEqual([
      '"Restaurant","Table","Link"',
      '"Dar Zitoun","1","https://foodify.app/restaurant/dar-zitoun?table=1"',
      '"Dar Zitoun","2","https://foodify.app/restaurant/dar-zitoun?table=2"',
    ])
  })

  it('separates the rows with CRLF, which is what a spreadsheet expects', () => {
    expect(tablesCsv(restaurant, ORIGIN, 2)).toContain('"\r\n"')
  })

  it('survives a name carrying a comma or a quote', () => {
    const awkward = { name: 'Chez "Ali", Marrakech', slug: 'chez-ali' }
    const [, row] = tablesCsv(awkward, ORIGIN, 1).split('\r\n')
    expect(row).toBe('"Chez ""Ali"", Marrakech","1","https://foodify.app/restaurant/chez-ali?table=1"')
  })

  it('is the header alone when no tables are set, not an empty file', () => {
    expect(tablesCsv(restaurant, ORIGIN, 0)).toBe('"Restaurant","Table","Link"')
  })
})
