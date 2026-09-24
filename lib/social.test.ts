import { describe, expect, it } from 'vitest'
import { SOCIAL_NETWORKS, parseSocialMedia, socialUrl } from './social'

describe('parseSocialMedia', () => {
  it('returns every network null for a blank or missing value', () => {
    const p = parseSocialMedia(null)
    expect(SOCIAL_NETWORKS.every((n) => p[n.key] === null)).toBe(true)
    expect(parseSocialMedia('').instagram).toBe(null)
  })

  it('reads a JSON object, taking a bare handle from a handle, an @handle or a full URL', () => {
    const p = parseSocialMedia('{"instagram":"@laplace","facebook":"https://facebook.com/laplace","tiktok":"laplace"}')
    expect(p.instagram).toBe('laplace')
    expect(p.facebook).toBe('laplace')
    expect(p.tiktok).toBe('laplace')
  })

  it('keeps a phone as digits for WhatsApp and the whole URL for Tripadvisor', () => {
    const p = parseSocialMedia('{"whatsapp":"+212 6 12 34 56 78","tripadvisor":"tripadvisor.co.uk/Restaurant_Review-x"}')
    expect(p.whatsapp).toBe('212612345678')
    expect(p.tripadvisor).toBe('https://tripadvisor.co.uk/Restaurant_Review-x')
  })

  it('reads the legacy free text: one entry per line, a URL or "network: value"', () => {
    const p = parseSocialMedia('instagram: @laplace\nhttps://www.youtube.com/@laplace\nhttps://x.com/laplace')
    expect(p.instagram).toBe('laplace')
    expect(p.youtube).toBe('laplace')
    expect(p.twitter).toBe('laplace')
  })

  it('takes the first value seen for a network and ignores an unknown one', () => {
    const p = parseSocialMedia('{"ig":"first","instagram":"second","myspace":"x"}')
    expect(p.instagram).toBe('first')
  })

  it('adds https:// to a bare Tripadvisor value and reads a subdomain host', () => {
    expect(parseSocialMedia('{"tripadvisor":"www.tripadvisor.com/x"}').tripadvisor).toBe('https://www.tripadvisor.com/x')
    expect(parseSocialMedia('https://en.tripadvisor.com/y').tripadvisor).toBe('https://en.tripadvisor.com/y')
  })

  it('drops what it cannot read: a malformed URL, a phone with no digits, a non-object JSON, an unknown host or label', () => {
    expect(parseSocialMedia('{"instagram":"https://"}').instagram).toBe(null)
    expect(parseSocialMedia('{"whatsapp":"call us"}').whatsapp).toBe(null)
    expect(parseSocialMedia('["instagram","x"]').instagram).toBe(null)
    expect(parseSocialMedia('https://example.com/x\nunknown: value\njust some words').instagram).toBe(null)
  })

  it('drops a profile URL with no handle in it and a line whose URL does not parse, and skips blank lines', () => {
    expect(parseSocialMedia('{"instagram":"https://instagram.com/"}').instagram).toBe(null)
    expect(parseSocialMedia('{"instagram":"   "}').instagram).toBe(null)
    expect(parseSocialMedia('https://[instagram.com/x').instagram).toBe(null)
    expect(parseSocialMedia('\n\nfollow us https://instagram.com/laplace\n').instagram).toBe('laplace')
  })
})

describe('socialUrl', () => {
  it('builds the public URL per network from the stored value', () => {
    expect(socialUrl('instagram', 'laplace')).toBe('https://instagram.com/laplace')
    expect(socialUrl('twitter', 'laplace')).toBe('https://x.com/laplace')
    expect(socialUrl('tiktok', 'laplace')).toBe('https://tiktok.com/@laplace')
    expect(socialUrl('youtube', 'laplace')).toBe('https://youtube.com/@laplace')
    expect(socialUrl('snapchat', 'laplace')).toBe('https://snapchat.com/add/laplace')
    expect(socialUrl('whatsapp', '212612345678')).toBe('https://wa.me/212612345678')
    expect(socialUrl('tripadvisor', 'https://tripadvisor.fr/x')).toBe('https://tripadvisor.fr/x')
    expect(socialUrl('tripadvisor', 'tripadvisor.fr/x')).toBe('https://tripadvisor.fr/x')
  })

  it('reads a key no network carries as Instagram, the first listed', () => {
    expect(socialUrl('myspace', 'laplace')).toBe('https://instagram.com/laplace')
  })
})
