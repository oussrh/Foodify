import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BRAND_IMAGE_LIMITS, uploadBrandImage, validateBrandImage, type BrandUploadAction } from './brand-upload'
import { callArgs } from '@/test/mock-calls'

// uploadDirect reads publicEnv on every call, so mutating this hoisted object between tests is
// enough: no re-import needed.
const env = vi.hoisted((): { cloudinaryCloudName?: string | undefined; cloudinaryUploadPreset?: string | undefined } => ({}))
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
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const configured = () => {
    env.cloudinaryCloudName = 'demo'
    env.cloudinaryUploadPreset = 'unsigned'
  }
  const cloudinaryAnswers = (response: Partial<Response>) => {
    // The code under test reads only ok, status and json(); a Partial is the whole contract here.
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response as Response)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('uploads straight to Cloudinary when the unsigned preset is configured', async () => {
    configured()
    const fetchMock = cloudinaryAnswers({ ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/demo/logo.png' }) })
    const viaServer = vi.fn<BrandUploadAction>()
    const url = await uploadBrandImage(file('l.png', 'image/png', 10), 'logo', 'dar-zitoun', viaServer)
    expect(url).toBe('https://res.cloudinary.com/demo/logo.png')
    expect(viaServer).not.toHaveBeenCalled()
    const [target, init] = callArgs(fetchMock)
    expect(target).toBe('https://api.cloudinary.com/v1_1/demo/image/upload')
    expect(init?.body).toBeInstanceOf(FormData)
    if (init?.body instanceof FormData) {
      expect(init.body.get('folder')).toBe('restaurants/dar-zitoun/branding')
      expect(init.body.get('public_id')).toBe('logo')
    }
  })

  it('falls back to the server action when the direct upload is rejected', async () => {
    configured()
    cloudinaryAnswers({ ok: false, status: 401 })
    const viaServer = vi.fn<BrandUploadAction>().mockResolvedValue({ success: true, logoUrl: 'https://cdn/logo.png' })
    await expect(uploadBrandImage(file('l.png', 'image/png', 10), 'logo', 's', viaServer)).resolves.toBe('https://cdn/logo.png')
  })

  it('treats a 200 with an error body, or without a URL, as a failed direct upload and uses the server', async () => {
    configured()
    cloudinaryAnswers({ ok: true, json: async () => ({ error: { message: 'Invalid preset' } }) })
    const viaServer = vi.fn<BrandUploadAction>().mockResolvedValue({ success: true, logoUrl: 'https://cdn/logo.png' })
    await expect(uploadBrandImage(file('l.png', 'image/png', 10), 'logo', 's', viaServer)).resolves.toBe('https://cdn/logo.png')
    cloudinaryAnswers({ ok: true, json: async () => ({}) })
    await expect(uploadBrandImage(file('l.png', 'image/png', 10), 'logo', 's', viaServer)).resolves.toBe('https://cdn/logo.png')
    expect(viaServer).toHaveBeenCalledTimes(2)
  })

  it('says "Upload failed" when the server action refuses without a message', async () => {
    const viaServer = vi.fn<BrandUploadAction>().mockResolvedValue({ success: false })
    await expect(uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'logo', 's', viaServer)).rejects.toThrow('Upload failed')
  })

  it('sends the file and the slug to the server action when direct upload is not configured', async () => {
    const viaServer = vi.fn<BrandUploadAction>().mockResolvedValue({ success: true, coverUrl: 'https://cdn/cover.jpg' })
    await uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'cover', 'dar-zitoun', viaServer)
    expect(viaServer).toHaveBeenCalledTimes(1)
    const [body, slug] = callArgs(viaServer)
    expect(slug).toBe('dar-zitoun')
    const sent = body.get('file')
    expect(sent).toBeInstanceOf(File)
    if (sent instanceof File) expect(sent.name).toBe('c.jpg')
  })

  it('returns the URL of the kind it uploaded from the server action answer', async () => {
    const cover = vi.fn<BrandUploadAction>().mockResolvedValue({ success: true, coverUrl: 'https://cdn/cover.jpg' })
    await expect(uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'cover', 's', cover)).resolves.toBe('https://cdn/cover.jpg')
    const logo = vi.fn<BrandUploadAction>().mockResolvedValue({ success: true, logoUrl: 'https://cdn/logo.png' })
    await expect(uploadBrandImage(file('l.png', 'image/png', 10), 'logo', 's', logo)).resolves.toBe('https://cdn/logo.png')
  })

  it('surfaces the server action error', async () => {
    const viaServer = vi.fn<BrandUploadAction>().mockResolvedValue({ success: false, error: 'Invalid file type.' })
    await expect(uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'logo', 's', viaServer)).rejects.toThrow('Invalid file type.')
  })

  it('fails when the server action answers success without a URL', async () => {
    const viaServer = vi.fn<BrandUploadAction>().mockResolvedValue({ success: true })
    await expect(uploadBrandImage(file('c.jpg', 'image/jpeg', 10), 'logo', 's', viaServer)).rejects.toThrow('Upload returned no URL')
  })
})
