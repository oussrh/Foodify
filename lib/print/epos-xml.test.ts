import { describe, expect, it } from 'vitest'
import { eposDocument, LINE_WIDTH, printRequest } from './epos-xml'

describe('eposDocument', () => {
  it('sets the language and font first, and ends with a feed and a cut', () => {
    const xml = eposDocument({ blocks: [] }, 'fr')
    expect(xml).toBe(
      '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"><text lang="fr" smooth="true"/><text font="font_a"/><feed line="3"/><cut type="feed"/></epos-print>',
    )
  })

  it('prints a dish at double height with its note indented under it, and resets the style after', () => {
    const xml = eposDocument({ blocks: [{ type: 'item', quantity: 2, name: 'Tagine poulet', note: 'sans olives' }] }, 'fr')
    expect(xml).toContain('<text dh="true" em="true">2 x Tagine poulet&#10;</text><text dh="false" em="false"/><text>    &gt; sans olives&#10;</text>')
  })

  it('centres a banner in reverse and puts the alignment back', () => {
    const xml = eposDocument({ blocks: [{ type: 'banner', text: 'CANCEL' }] }, 'en')
    expect(xml).toContain('<text align="center"/><text reverse="true" em="true" dw="true" dh="true"> CANCEL &#10;</text><text reverse="false" em="false" dw="false" dh="false"/><text align="left"/>')
  })

  it('prints a title at double size and bold text emphasised', () => {
    const xml = eposDocument({ blocks: [{ type: 'title', text: 'TABLE 12' }, { type: 'text', text: 'NOTE: sans sel', bold: true }] }, 'fr')
    expect(xml).toContain('<text dw="true" dh="true" em="true">TABLE 12&#10;</text><text dw="false" dh="false" em="false"/>')
    expect(xml).toContain('<text em="true">NOTE: sans sel&#10;</text><text em="false"/>')
  })

  it('makes dashes and an ellipsis plain', () => {
    expect(eposDocument({ blocks: [{ type: 'text', text: 'a – b — c…' }] }, 'en')).toContain('<text>a - b - c...&#10;</text>')
  })

  it('draws a rule the width of the paper', () => {
    expect(eposDocument({ blocks: [{ type: 'rule' }] }, 'en')).toContain(`<text>${'-'.repeat(LINE_WIDTH)}&#10;</text>`)
  })

  it('escapes what a guest typed, keeps it on one line and makes typographic quotes plain', () => {
    const xml = eposDocument({ blocks: [{ type: 'text', text: 'l’ail <pas> & "rien"\nd’autre' }] }, 'fr')
    expect(xml).toContain("<text>l'ail &lt;pas&gt; &amp; &quot;rien&quot; d'autre&#10;</text>")
  })

  it('keeps French accents as they are, for the printer to encode', () => {
    expect(eposDocument({ blocks: [{ type: 'text', text: 'Crème brûlée, œuf, ça' }] }, 'fr')).toContain('Crème brûlée, œuf, ça')
  })
})

describe('printRequest', () => {
  it('wraps each job with its id, in order, under a Version 2.00 envelope', () => {
    const xml = printRequest([
      { id: 'J1', document: '<epos-print/>' },
      { id: 'J2', document: '<epos-print/>' },
    ])
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?><PrintRequestInfo Version="2.00">')).toBe(true)
    expect(xml.match(/<printjobid>(J\d)<\/printjobid>/g)).toEqual(['<printjobid>J1</printjobid>', '<printjobid>J2</printjobid>'])
    expect(xml).toContain('<devid>local_printer</devid><timeout>10000</timeout>')
  })
})
