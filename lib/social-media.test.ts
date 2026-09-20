import { describe, expect, it } from 'vitest'
import { parseSocialMedia } from './social-media'

const none = { instagram: null, facebook: null, twitter: null }

describe('parseSocialMedia', () => {
  it('returns every platform null for an empty column', () => {
    expect(parseSocialMedia(null)).toEqual(none)
    expect(parseSocialMedia('  ')).toEqual(none)
  })

  it('reads the JSON shape and strips a leading @', () => {
    expect(parseSocialMedia('{"instagram":"@darzitoun","facebook":"dar.zitoun","twitter":""}')).toEqual({
      instagram: 'darzitoun',
      facebook: 'dar.zitoun',
      twitter: null,
    })
  })

  it('accepts platform aliases as JSON keys', () => {
    expect(parseSocialMedia('{"ig":"a","fb":"b","x":"c"}')).toEqual({ instagram: 'a', facebook: 'b', twitter: 'c' })
  })

  it('reduces a full profile URL to its handle so the footer link is not doubled', () => {
    expect(parseSocialMedia('{"instagram":"https://www.instagram.com/darzitoun/?hl=en"}').instagram).toBe('darzitoun')
  })

  it('parses labelled free-text lines with :, - or a space', () => {
    expect(parseSocialMedia('Instagram: @one\nfacebook - two\ntwitter three')).toEqual({ instagram: 'one', facebook: 'two', twitter: 'three' })
  })

  it('detects the platform of a bare URL from its host, including x.com and fb.com', () => {
    expect(parseSocialMedia('https://x.com/handle\nhttp://fb.com/page')).toEqual({ instagram: null, facebook: 'page', twitter: 'handle' })
  })

  it('keeps the first value for a platform given twice', () => {
    expect(parseSocialMedia('instagram: first\ninstagram: second').instagram).toBe('first')
  })

  it('ignores lines it cannot place and never throws', () => {
    expect(parseSocialMedia('tiktok: nope\nhttps://example.com/x\nhttp://[bad\njust words')).toEqual(none)
    expect(parseSocialMedia('[1,2]')).toEqual(none)
  })
})
