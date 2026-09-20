// lib/social-media.ts

export interface SocialHandles {
  instagram: string | null
  facebook: string | null
  twitter: string | null
}

type Platform = keyof SocialHandles

const EMPTY: SocialHandles = { instagram: null, facebook: null, twitter: null }

const PLATFORM_ALIASES: Record<string, Platform> = {
  instagram: 'instagram',
  insta: 'instagram',
  ig: 'instagram',
  facebook: 'facebook',
  fb: 'facebook',
  twitter: 'twitter',
  x: 'twitter',
}

function detectPlatformFromHost(host: string): Platform | null {
  const h = host.toLowerCase().replace(/^www\./, '')
  if (h === 'instagram.com' || h.endsWith('.instagram.com')) return 'instagram'
  if (h === 'facebook.com' || h.endsWith('.facebook.com') || h === 'fb.com') return 'facebook'
  if (h === 'twitter.com' || h.endsWith('.twitter.com') || h === 'x.com') return 'twitter'
  return null
}

/**
 * Normalizes a raw value (handle, "@handle", or full profile URL) into a bare
 * handle. The footer builds links as `https://<platform>.com/<handle>`, so a
 * full URL would otherwise produce a broken link.
 */
function toHandle(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      const [first] = url.pathname.split('/').filter(Boolean)
      return first ? first.replace(/^@/, '') : null
    } catch {
      return null
    }
  }

  return trimmed.replace(/^@/, '') || null
}

/**
 * Parses the `Restaurant.socialMedia` column into per-platform handles.
 *
 * Accepts either:
 *  - a JSON object: `{"instagram": "foo", "facebook": "bar", "twitter": "baz"}`
 *  - free text, one entry per line, each being a profile URL
 *    (`https://www.instagram.com/foo`) or `platform: value` (`instagram: @foo`)
 *
 * Never throws — anything unrecognized is ignored.
 */
export function parseSocialMedia(raw: string | null | undefined): SocialHandles {
  if (!raw || !raw.trim()) return { ...EMPTY }

  const result: SocialHandles = { ...EMPTY }

  const assign = (platform: Platform, value: string) => {
    if (result[platform]) return
    const handle = toHandle(value)
    if (handle) result[platform] = handle
  }

  // 1. JSON object format
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        const platform = PLATFORM_ALIASES[key.toLowerCase()]
        if (platform && typeof value === 'string') assign(platform, value)
      }
      return result
    }
  } catch {
    // Not JSON — fall through to free-text parsing
  }

  // 2. Free-text format: one entry per line
  for (const line of raw.split(/\r?\n/)) {
    const entry = line.trim()
    if (!entry) continue

    // "platform: value" / "platform - value" / "platform value"
    const labelled = entry.match(/^([a-z]+)\s*[:\-=]?\s+(.+)$/i)
    if (labelled) {
      const platform = PLATFORM_ALIASES[labelled[1].toLowerCase()]
      if (platform) {
        assign(platform, labelled[2])
        continue
      }
    }

    // Bare URL — detect platform from the hostname
    const urlMatch = entry.match(/https?:\/\/[^\s]+/i)
    if (urlMatch) {
      try {
        const platform = detectPlatformFromHost(new URL(urlMatch[0]).host)
        if (platform) assign(platform, urlMatch[0])
      } catch {
        // ignore malformed URL
      }
    }
  }

  return result
}
