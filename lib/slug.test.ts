import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('folds accents, case, spaces and punctuation into the slug rule', () => {
    expect(slugify('Café Ñandú & Co.')).toBe('cafe-nandu-co')
    expect(slugify('  Chez  Test ')).toBe('chez-test')
  })
})
