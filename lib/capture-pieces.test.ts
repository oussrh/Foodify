import { describe, expect, it } from 'vitest'
import { PIECE_BYTES, pieces } from './capture-pieces'

const URL_SIGNED = 'https://engine.test/jobs/j1/source?name=capture.mp4&exp=1&sig=ab'

describe('pieces', () => {
  it('sends a small file as one piece, still numbered, on its signed address', () => {
    expect(pieces(URL_SIGNED, 10)).toEqual([{ url: `${URL_SIGNED}&part=0&parts=1`, start: 0, end: 10 }])
  })

  it('covers every byte once, the last piece the remainder', () => {
    const all = pieces(URL_SIGNED, 2 * PIECE_BYTES + 5)
    expect(all.map(({ start, end }) => [start, end])).toEqual([
      [0, PIECE_BYTES],
      [PIECE_BYTES, 2 * PIECE_BYTES],
      [2 * PIECE_BYTES, 2 * PIECE_BYTES + 5],
    ])
    expect(all.map((p) => new URL(p.url).searchParams.get('part'))).toEqual(['0', '1', '2'])
  })

  it('makes no empty last piece when the size divides evenly', () => {
    expect(pieces(URL_SIGNED, 2 * PIECE_BYTES)).toHaveLength(2)
  })

  it('keeps the signature and the file name untouched', () => {
    const address = new URL(pieces(URL_SIGNED, 1)[0]?.url ?? '')
    expect([address.searchParams.get('name'), address.searchParams.get('sig'), address.searchParams.get('exp')]).toEqual(['capture.mp4', 'ab', '1'])
  })
})
