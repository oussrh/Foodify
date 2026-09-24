import { describe, expect, it } from 'vitest'
import { imageUpload, restaurantInput, restaurantPatch, slug, uploadedImageUrl } from './restaurant'

const restaurant = { name: 'Chez Test', slug: 'chez-test', defaultLocale: 'en' }

describe('restaurant schemas', () => {
  it('accepts an empty website and refuses a malformed one', () => {
    expect(restaurantInput.safeParse({ ...restaurant, website: '' }).success).toBe(true)
    expect(restaurantInput.safeParse({ ...restaurant, website: 'chez test' }).success).toBe(false)
  })

  it('holds the slug to lowercase letters, digits and hyphens', () => {
    expect(restaurantInput.safeParse({ ...restaurant, slug: 'Chez Test' }).error?.issues[0]?.message).toMatch(/lowercase/)
  })

  it('takes the dietary options a restaurant offers as vocabulary keys and refuses a key the menu cannot label', () => {
    expect(restaurantPatch.safeParse({ dietaryOptions: ['halal', 'vegan'] }).success).toBe(true)
    expect(restaurantPatch.safeParse({ dietaryOptions: [] }).success).toBe(true)
    expect(restaurantPatch.safeParse({ dietaryOptions: ['keto'] }).error?.issues[0]?.message).toBe('Unknown dietary attribute')
    expect('priceRange' in restaurantInput.shape).toBe(false)
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

  it('takes a menu font stylesheet from Google Fonts only, over https', () => {
    const font = (googleFontUrl: string) => restaurantPatch.safeParse({ googleFontUrl }).success
    expect(font('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400&display=swap')).toBe(true)
    expect(font('')).toBe(true)
    expect(font('https://evil.example/font.css')).toBe(false)
    expect(font('http://fonts.googleapis.com/css2?family=Inter')).toBe(false)
    expect(font('https://fonts.googleapis.com.evil.example/css2')).toBe(false)
  })

  it('takes a logo or a cover as an https address only', () => {
    expect(restaurantPatch.safeParse({ logoUrl: 'https://res.cloudinary.com/x/logo.png', coverImageUrl: '' }).success).toBe(true)
    expect(restaurantPatch.safeParse({ logoUrl: 'javascript:alert(1)' }).success).toBe(false)
    expect(restaurantPatch.safeParse({ coverImageUrl: 'http://example.com/c.jpg' }).success).toBe(false)
    expect(uploadedImageUrl.safeParse('data:image/png;base64,AAAA').success).toBe(false)
  })

  it('takes the brand colours as hex or not set', () => {
    expect(restaurantPatch.safeParse({ colorTheme: '#B8860B', secondaryColor: '#f00' }).success).toBe(true)
    expect(restaurantPatch.safeParse({ colorTheme: '' }).success).toBe(true)
    expect(restaurantPatch.safeParse({ colorTheme: 'red' }).success).toBe(false)
    expect(restaurantPatch.safeParse({ secondaryColor: '#12345' }).success).toBe(false)
  })

  it('bounds every free-text field', () => {
    expect(restaurantPatch.safeParse({ tagline: 'x'.repeat(201) }).success).toBe(false)
    expect(restaurantPatch.safeParse({ description: 'x'.repeat(2001) }).success).toBe(false)
    expect(restaurantPatch.safeParse({ name: 'x'.repeat(121) }).success).toBe(false)
    expect(restaurantPatch.safeParse({ phone: '📞+212 719790607' }).success).toBe(true)
  })

  it('holds an upload\'s slug to the stored rule, since it names a storage folder', () => {
    expect(slug.safeParse('foodify-test-kitchen').success).toBe(true)
    expect(slug.safeParse('../other').success).toBe(false)
  })
})
