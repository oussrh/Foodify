import { describe, expect, it } from 'vitest'
import { PRINT_TEXT } from './print-text'

describe('PRINT_TEXT', () => {
  it('says every sentence in both languages, with the number or name in it', () => {
    for (const text of Object.values(PRINT_TEXT)) {
      expect(text.additionTo(140)).toContain('#140')
      expect(text.waiter('sara')).toContain('sara')
      expect(text.cancelWhole(147)).toContain('#147')
      expect(text.cancelSome(147)).toContain('#147')
      expect(text.testBody('Pass')).toContain('Pass')
    }
  })

  it('names the same reasons in both languages', () => {
    expect(Object.keys(PRINT_TEXT.fr.reason)).toEqual(Object.keys(PRINT_TEXT.en.reason))
  })
})
