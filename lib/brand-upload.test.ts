import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BRAND_IMAGE_LIMITS, uploadBrandImage, validateBrandImage } from './brand-upload'

// The module reads publicEnv once at import; the tests decide per case whether direct upload is configured.
const env = vi.hoisted(() => ({ cloudinaryCloudName: undefined as string | undefined, cloudinaryUploadPreset: undefined as string | undefined }))
vi.mock('@/lib/env', () => ({ publicEnv: env }))

const file = (name: string, type: string, bytes: number) => new File([new Uint8Array(bytes)], name, { type })

describe('validateBrandImage', () => {
  it('accepts a PNG logo under the limit', () => {
    expect(validateBrandImage(file('logo.png', 'image/png', 1024), 'logo')).toBeNull()
  })

  it('refuses a type the tile does not support, naming the hint', () => {
    expect(validateBrandImage(file('logo.gif', 'image/gif', 10), 'logo')).toContain(BRAND_IMAGE_LIMITS.logo.hint)
  })

  it('allows SVG for a logo but not for a cover', () => {
    expect(validateBrandImage(file('a.svg', 'image/svg+xml', 10), 'logo')).toBeNull()
    expect(validateBrandImage(file('a.svg', 'image/svg+xml', 10), 'cover')).not.toBeNull()
  })

  it('refuses a file over the size limit of its kind, stating both numbers', () => {
    const msg = validateBrandImage(file('big.jpg', 'image/jpeg', 6 * 1024 * 1024), 'logo')
    expect(msg).toBe('That file is 6.0 MB; the limit is 5 MB.')
    expect(validateBrandImage(file('big.jpg', 'image/jpeg', 6 * 1024 * 1024), 'cover')).toBeNull()
  })

  it('refuses a double extension', () => {
    expect(validateBrandImage(file('logo.svg.png', 'image/png', 10), 'logo')).toMatch(/double extension/)
  })
})

describe('uploadBrandImage', () => {
  beforeEach(() => {
    env.cloudinaryCloudName = undefined
    env.cloudinaryUploadPreset = undefined
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uploads straight to Cloudinary when the unsigned preset is configured', async () => {
    env.cloudinaryCloudName = 'demo'
    env.cloudinaryUploadPreset = 'unsigned'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/demo/logo.png' }) })
    vi.stubGlobal('fetch', fetchMock)
    const viaServer = vi.fn()
    const url = await uploadBrandImage(file('l.png', 'image/png', 10), 'logo', 'dar-zitoun', viaServer)
    expect(url).toBe('https://res.cloudinary.com/demo/logo.png')
    expect(viaServer).not.toHaveBeenCalled()
    const [target, init] = fetchMock.mock.calls[0] as [string, { body: FormData }]
    expect(target).toBe('https://api.cloudinary.com/v1_1/demo/image/upload')
    expect(init.body.get('folder')).toBe('restaurants/dar-zitoun/branding')
    expect(init.body.get('public_id')).toBe('logo')
  })

  it('falls back to the server action when the direct upload is rejected', async () => {
    env.cloudinaryCloudName = 'demo'
    env.cloudinaryUploadPreset = 'unsigned'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const viaServer = vi.fn().mockResolvedValue({ success: true, logoUrl: 'https://cdn/logo.png' })
    await expect(uploadBrandImage(file('l.png', 'image/png', 10), 'logo', 's', viaServer)).resolves.toBe('https://cdn/logo.png')
  })

  it('falls back to the server action when direct upload is not configured, and picks the URL of its kind', async () => {
    const viaServer = vi.fn().mockResolvedValue({ success: true, coverUrl: 'https://cdn/cover.jpg' })
    const url = await uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'cover', 'dar-zitoun', viaServer)
    expect(url).toBe('https://cdn/cover.jpg')
    expect(viaServer).toHaveBeenCalledTimes(1)
    const [body, slug] = viaServer.mock.calls[0] as [FormData, string]
    expect(slug).toBe('dar-zitoun')
    expect((body.get('file') as File).name).toBe('c.jpg')
  })

  it('surfaces the server action error', async () => {
    const viaServer = vi.fn().mockResolvedValue({ success: false, error: 'Invalid file type.' })
    await expect(uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'logo', 's', viaServer)).rejects.toThrow('Invalid file type.')
  })

  it('fails when the server action answers success without a URL', async () => {
    const viaServer = vi.fn().mockResolvedValue({ success: true })
    await expect(uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'logo', 's', viaServer)).rejects.toThrow('Upload returned no URL')
  })
})
