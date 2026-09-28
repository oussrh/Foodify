import { describe, expect, it } from 'vitest'
import { cancelDoc, testDoc, ticketDoc, type TicketSource } from './ticket'

const source: TicketSource = {
  number: 147,
  table: '12',
  parentNumber: null,
  placedBy: 'sara',
  note: 'allergie arachides',
  time: '19:42',
  items: [
    { quantity: 2, name: 'Tagine poulet', note: 'sans olives' },
    { quantity: 0, name: 'Harira', note: null },
    { quantity: 1, name: 'Couscous royal', note: null },
  ],
}

describe('ticketDoc', () => {
  it('lays out the table and number, who sent it, the dishes still wanted and the note', () => {
    expect(ticketDoc(source, 'fr')).toEqual({
      blocks: [
        { type: 'title', text: 'TABLE 12  #147' },
        { type: 'text', text: '19:42 · Serveur : sara' },
        { type: 'rule' },
        { type: 'item', quantity: 2, name: 'Tagine poulet', note: 'sans olives' },
        { type: 'item', quantity: 1, name: 'Couscous royal', note: null },
        { type: 'rule' },
        { type: 'text', text: 'NOTE: allergie arachides', bold: true },
      ],
    })
  })

  it('marks an addition with the bill it adds to, and a guest order as such', () => {
    const blocks = ticketDoc({ ...source, parentNumber: 140, placedBy: null, note: null }, 'en').blocks
    expect(blocks[0]).toEqual({ type: 'banner', text: 'ADDITION TO #140' })
    expect(blocks[2]).toEqual({ type: 'text', text: '19:42 · Guest order (QR)' })
    expect(blocks.at(-1)).toEqual({ type: 'item', quantity: 1, name: 'Couscous royal', note: null })
  })
})

describe('cancelDoc', () => {
  it('stops a whole ticket under a CANCEL banner, with the reason', () => {
    const doc = cancelDoc({ ...source, items: [{ quantity: 2, name: 'Tagine poulet', note: null }] }, { whole: true, reason: 'changed_mind' }, 'en')
    expect(doc.blocks[0]).toEqual({ type: 'banner', text: 'CANCEL' })
    expect(doc.blocks.slice(4)).toEqual([
      { type: 'text', text: 'Stop all of ticket #147', bold: true },
      { type: 'item', quantity: 2, name: 'Tagine poulet', note: null },
      { type: 'rule' },
      { type: 'text', text: 'Guest changed their mind' },
    ])
  })

  it('takes off only the dishes a removal names, and says no reason when none was given', () => {
    const doc = cancelDoc(source, { whole: false, items: [{ quantity: 1, name: 'Couscous royal', note: null }], reason: null }, 'fr')
    expect(doc.blocks.slice(4)).toEqual([
      { type: 'text', text: 'Retirer du ticket #147', bold: true },
      { type: 'item', quantity: 1, name: 'Couscous royal', note: null },
    ])
  })
})

describe('testDoc', () => {
  it('names the printer', () => {
    const doc = testDoc('Pass', '10:05', 'en')
    expect(doc.blocks).toContainEqual({ type: 'text', text: 'Printer “Pass” is set up. Kitchen tickets will print here.' })
  })
})
