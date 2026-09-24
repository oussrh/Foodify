import { describe, expect, it } from 'vitest'
import { dishInput, dishPatch } from './dish'

const dish = { nameEn: 'Grilled Chicken', nameFr: 'Poulet grillé', price: '12.5', imageUrl: '/chicken.jpg' }

describe('dish schemas', () => {
  it('accepts the seed dish with its price normalised to two decimals, and refuses a float', () => {
    expect(dishInput.safeParse(dish).data?.price).toBe('12.50')
    expect(dishInput.safeParse({ ...dish, price: 12.5 }).success).toBe(false)
    expect(dishInput.safeParse({ ...dish, price: '-1' }).error?.issues[0]?.message).toMatch(/two decimals/)
  })

  it('only stores dietary and allergen keys the menu can label', () => {
    expect(dishInput.safeParse({ ...dish, dietary: ['vegan'], allergens: ['nuts'] }).success).toBe(true)
    expect(dishInput.safeParse({ ...dish, dietary: ['keto'] }).success).toBe(false)
  })

  it('accepts a dish with no image (an image is optional; the menu shows a placeholder)', () => {
    expect(dishInput.safeParse({ ...dish, imageUrl: '' }).success).toBe(true)
    expect(dishInput.safeParse({ ...dish, imageUrl: '' }).data?.imageUrl).toBe('')
  })

  it('lets a patch carry any subset, plus the active flag', () => {
    expect(dishPatch.safeParse({ isActive: false }).success).toBe(true)
    expect(dishPatch.safeParse({ calories: 1.5 }).success).toBe(false)
  })

  it('takes an image or a model as none, a path on this site or an https address', () => {
    const asset = (imageUrl: string) => dishInput.safeParse({ ...dish, imageUrl }).success
    expect(asset('')).toBe(true)
    expect(asset('/ar/chicken.usdz')).toBe(true)
    expect(asset('https://res.cloudinary.com/x/raw/upload/a.glb')).toBe(true)
    expect(asset('//evil.example/a.glb')).toBe(false)
    expect(asset('http://169.254.169.254/latest')).toBe(false)
    expect(asset('file:///etc/passwd')).toBe(false)
    expect(dishPatch.safeParse({ glbUrl: 'ftp://x/a.glb' }).success).toBe(false)
  })

  it('refuses negative calories and a description past the limit', () => {
    expect(dishInput.safeParse({ ...dish, calories: -1 }).success).toBe(false)
    expect(dishInput.safeParse({ ...dish, calories: null }).success).toBe(true)
    expect(dishInput.safeParse({ ...dish, descriptionFr: 'x'.repeat(2001) }).success).toBe(false)
  })
})
