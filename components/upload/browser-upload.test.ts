import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isBrowserUploadConfigured, uploadToCloudinary, uploadWithServerFallback } from './browser-upload'
import { arModelTarget, brandImageTarget, dishImageTarget, restaurantFolderName } from './targets'

// uploadToCloudinary reads publicEnv on every call, so mutating this hoisted object between
// tests is enough: no re-import needed.
const env = vi.hoisted((): { cloudinaryCloudName?: string; cloudinaryUploadPreset?: string } => ({}))
vi.mock('@/lib/env', () => ({ publicEnv: env }))

const file = (name: string, type: string, bytes = 16) => new File([new Uint8Array(bytes)], name, { type })

const configured = () => {
  env.cloudinaryCloudName = 'demo'
  env.cloudinaryUploadPreset = 'unsigned'
}

// The code under test reads only ok, status, statusText, text() and json(); a Partial is the whole contract here.
const cloudinaryAnswers = (response: Partial<Response>) => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response as Response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const fieldsOf = (fetchMock: ReturnType<typeof cloudinaryAnswers>) => {
  const body = fetchMock.mock.calls[0][1]?.body as FormData
  return [...body.entries()].map(([k, v]) => [k, v instanceof File ? `file:${v.name}` : v])
}

describe('targets', () => {
  it('names the restaurant folder with underscores, lower case', () => {
    expect(restaurantFolderName('Chez  Oussama Deux')).toBe('chez_oussama_deux')
  })

  it('puts AR models under the restaurant ar folder as raw files with a timestamped id', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    expect(arModelTarget('Chez Oussama', 'usdz')).toEqual({ folder: 'restaurants/chez_oussama/ar', publicId: 'usdz_1700000000000', resourceType: 'raw' })
    expect(dishImageTarget('Chez Oussama')).toEqual({ folder: 'restaurants/chez_oussama/dishes', publicId: 'dish_1700000000000', resourceType: 'image' })
    vi.restoreAllMocks()
  })

  it('gives a logo and a cover a fixed id under branding, with no resource type', () => {
    expect(brandImageTarget('chez-oussama', 'logo')).toEqual({ folder: 'restaurants/chez-oussama/branding', publicId: 'logo' })
    expect(brandImageTarget('chez-oussama', 'cover')).toEqual({ folder: 'restaurants/chez-oussama/branding', publicId: 'cover' })
  })
})

describe('uploadToCloudinary', () => {
  beforeEach(() => {
    env.cloudinaryCloudName = undefined
    env.cloudinaryUploadPreset = undefined
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reports the browser upload as configured only with both public variables', () => {
    expect(isBrowserUploadConfigured()).toBe(false)
    env.cloudinaryCloudName = 'demo'
    expect(isBrowserUploadConfigured()).toBe(false)
    env.cloudinaryUploadPreset = 'unsigned'
    expect(isBrowserUploadConfigured()).toBe(true)
  })

  it('names the missing variable before sending anything', async () => {
    const fetchMock = cloudinaryAnswers({ ok: true })
    await expect(uploadToCloudinary(file('a.glb', ''), arModelTarget('R', 'glb'))).rejects.toThrow(
      'Cloudinary cloud name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment variables.',
    )
    env.cloudinaryCloudName = 'demo'
    await expect(uploadToCloudinary(file('a.glb', ''), arModelTarget('R', 'glb'))).rejects.toThrow(
      'Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the form to the endpoint of the resource type, fields in order', async () => {
    configured()
    const answer = { secure_url: 'https://res.cloudinary.com/demo/raw/upload/x.glb', public_id: 'glb_1', resource_type: 'raw', format: 'glb' }
    const fetchMock = cloudinaryAnswers({ ok: true, json: async () => answer })
    const result = await uploadToCloudinary(file('dish.glb', ''), { folder: 'restaurants/r/ar', publicId: 'glb_1', resourceType: 'raw' })
    expect(result).toEqual(answer)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.cloudinary.com/v1_1/demo/raw/upload')
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
    expect(fieldsOf(fetchMock)).toEqual([
      ['file', 'file:dish.glb'],
      ['upload_preset', 'unsigned'],
      ['folder', 'restaurants/r/ar'],
      ['resource_type', 'raw'],
      ['public_id', 'glb_1'],
    ])
  })

  it('uses the image endpoint and omits resource_type for a branding target', async () => {
    configured()
    const fetchMock = cloudinaryAnswers({ ok: true, json: async () => ({ secure_url: 'u' }) })
    await uploadToCloudinary(file('logo.png', 'image/png'), brandImageTarget('r', 'logo'))
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.cloudinary.com/v1_1/demo/image/upload')
    expect(fieldsOf(fetchMock).map(([k]) => k)).toEqual(['file', 'upload_preset', 'folder', 'public_id'])
  })

  it('turns a non-2xx answer into an error naming the status', async () => {
    configured()
    cloudinaryAnswers({ ok: false, status: 400, statusText: 'Bad Request', text: async () => 'Invalid preset' })
    await expect(uploadToCloudinary(file('a.png', 'image/png'), brandImageTarget('r', 'cover'))).rejects.toThrow('Upload failed: 400 Bad Request')
  })

  it('surfaces the error Cloudinary puts in a 2xx body', async () => {
    configured()
    cloudinaryAnswers({ ok: true, json: async () => ({ error: { message: 'Upload preset not found' } }) })
    await expect(uploadToCloudinary(file('a.png', 'image/png'), brandImageTarget('r', 'cover'))).rejects.toThrow('Cloudinary error: Upload preset not found')
  })

  it('wraps a non-Error rejection as a network error', async () => {
    configured()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'))
    await expect(uploadToCloudinary(file('a.png', 'image/png'), brandImageTarget('r', 'cover'))).rejects.toThrow('Network error occurred during upload')
  })
})

describe('uploadWithServerFallback', () => {
  beforeEach(() => {
    env.cloudinaryCloudName = undefined
    env.cloudinaryUploadPreset = undefined
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('answers with the browser upload URL when it works', async () => {
    configured()
    cloudinaryAnswers({ ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/demo/logo.png' }) })
    const action = vi.fn()
    const url = await uploadWithServerFallback(file('logo.png', 'image/png'), brandImageTarget('r', 'logo'), { action, slug: 'r', urlKey: 'logoUrl' })
    expect(url).toBe('https://res.cloudinary.com/demo/logo.png')
    expect(action).not.toHaveBeenCalled()
  })

  it('falls back to the server action with the file, and reads the URL under the key', async () => {
    const action = vi.fn().mockResolvedValue({ success: true, coverUrl: 'https://res.cloudinary.com/demo/cover.png' })
    const url = await uploadWithServerFallback(file('cover.png', 'image/png'), brandImageTarget('r', 'cover'), { action, slug: 'r', urlKey: 'coverUrl' })
    expect(url).toBe('https://res.cloudinary.com/demo/cover.png')
    const [body, slug] = action.mock.calls[0]
    expect(slug).toBe('r')
    expect((body as FormData).get('file')).toBeInstanceOf(File)
  })

  it('throws the server error, or the generic one, when the fallback fails too', async () => {
    const target = brandImageTarget('r', 'logo')
    await expect(uploadWithServerFallback(file('l.png', 'image/png'), target, { action: vi.fn().mockResolvedValue({ success: false, error: 'Forbidden' }), slug: 'r', urlKey: 'logoUrl' })).rejects.toThrow('Forbidden')
    await expect(uploadWithServerFallback(file('l.png', 'image/png'), target, { action: vi.fn().mockResolvedValue({ success: false }), slug: 'r', urlKey: 'logoUrl' })).rejects.toThrow('Server-side upload failed')
  })
})
