import { describe, expect, it } from 'vitest'
import { formatFileSize, validateArModel, validateBrandImage, validateDishImage } from './file-checks'

const file = (name: string, type: string, bytes: number) => new File([new Uint8Array(bytes)], name, { type })
const MB = 1024 * 1024

describe('formatFileSize', () => {
  it('picks the unit and keeps two decimals', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(512)).toBe('512 Bytes')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(52 * MB)).toBe('52 MB')
    expect(formatFileSize(2.5 * 1024 * MB)).toBe('2.5 GB')
  })
})

describe('validateArModel', () => {
  it('accepts the extension of the format, whatever its case', () => {
    expect(validateArModel(file('dish.USDZ', '', 10), 'usdz')).toBeNull()
    expect(validateArModel(file('dish.glb', '', 10), 'glb')).toBeNull()
  })

  it('refuses another extension, naming the expected one', () => {
    expect(validateArModel(file('dish.glb', '', 10), 'usdz')).toBe('Please select a .usdz file')
    expect(validateArModel(file('dish.usdz', '', 10), 'glb')).toBe('Please select a .glb file')
  })

  it('refuses a model over 50MB, stating the size', () => {
    expect(validateArModel(file('dish.glb', '', 51 * MB), 'glb')).toBe('File size must be less than 50MB. Current size: 51 MB')
    expect(validateArModel(file('dish.glb', '', 50 * MB), 'glb')).toBeNull()
  })
})

describe('validateDishImage', () => {
  it('accepts JPG, PNG, WebP and GIF under 10MB', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
      expect(validateDishImage(file('a', type, 10 * MB))).toBeNull()
    }
  })

  it('refuses a non-image, then an image format it does not take', () => {
    expect(validateDishImage(file('a.pdf', 'application/pdf', 10))).toBe('Please select an image file (JPG, PNG, WebP, or GIF)')
    expect(validateDishImage(file('a.bmp', 'image/bmp', 10))).toBe('Unsupported image format. Please use JPG, PNG, WebP, or GIF')
  })

  it('refuses an image over 10MB, stating the size', () => {
    expect(validateDishImage(file('a.png', 'image/png', 10 * MB + 1))).toBe('Image size must be less than 10MB. Current size: 10 MB')
  })
})

describe('validateBrandImage', () => {
  it('accepts JPG, JPEG, PNG, WebP and SVG', () => {
    for (const type of ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']) {
      expect(validateBrandImage(file('a', type, 10), 5)).toBeNull()
    }
    expect(validateBrandImage(file('a.gif', 'image/gif', 10), 5)).toBe('Please select a valid image file (JPG, PNG, WebP, or SVG)')
  })

  it('refuses a double extension', () => {
    expect(validateBrandImage(file('logo.svg.png', 'image/png', 10), 5)).toBe('File appears to have a double extension. Please rename the file and try again.')
    expect(validateBrandImage(file('logo.png', 'image/png', 10), 5)).toBeNull()
  })

  it('holds the limit of the kind: 5MB for a logo, 10MB for a cover', () => {
    expect(validateBrandImage(file('l.png', 'image/png', 6 * MB), 5)).toBe('File size must be less than 5MB. Current size: 6 MB')
    expect(validateBrandImage(file('c.png', 'image/png', 6 * MB), 10)).toBeNull()
    expect(validateBrandImage(file('c.png', 'image/png', 11 * MB), 10)).toBe('File size must be less than 10MB. Current size: 11 MB')
  })
})
