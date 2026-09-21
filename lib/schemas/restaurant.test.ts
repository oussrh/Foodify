import { describe, expect, it } from 'vitest'
import { imageUpload, restaurantInput, restaurantPatch } from './restaurant'

const restaurant = { name: 'Chez Test', slug: 'chez-test', defaultLocale: 'en' }

describe('restaurant schemas', () => {
  it('accepts an empty website and refuses a malformed one', () => {
    expect(restaurantInput.safeParse({ ...restaurant, website: '' }).success).toBe(true)
    expect(restaurantInput.safeParse({ ...restaurant, website: 'chez test' }).success).toBe(false)
  })

  it('holds the slug to lowercase letters, digits and hyphens', () => {
    expect(restaurantInput.safeParse({ ...restaurant, slug: 'Chez Test' }).error?.issues[0]?.message).toMatch(/lowercase/)
  })

  it('accepts a menu theme on a patch and nothing outside the three', () => {
    expect(restaurantPatch.safeParse({ menuTheme: 'dark' }).success).toBe(true)
    expect(restaurantPatch.safeParse({ menuTheme: 'sepia' }).success).toBe(false)
  })

  it('refuses an upload that is not a file, the wrong type, too big or double-extended, in the tile\'s words', () => {
    const upload = imageUpload(5)
    const message = (v: unknown) => upload.safeParse(v).error?.issues[0]?.message
    expect(message(null)).toBe('No file provided')
    expect(message(new File(['x'], 'a.gif', { type: 'image/gif' }))).toMatch(/Invalid file type/)
    expect(message(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' }))).toBe('File size must be less than 5MB')
    expect(message(new File(['x'], 'a.svg.png', { type: 'image/png' }))).toMatch(/double extension/)
    expect(upload.safeParse(new File(['x'], 'a.png', { type: 'image/png' })).success).toBe(true)
  })
})
