// lib/social-media.ts

/** Bare handles per platform (never URLs), null when unknown: what parseSocialMedia returns and the footer turns into links. */
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

type Entry = { platform: Platform; value: string }

/**
 * The entries of the JSON object format, in key order, or null when the text is not a JSON
 * object (not JSON, or an array, a string, a number, null).
 */
function jsonEntries(raw: string): Entry[] | null {
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const entries: Entry[] = []
    for (const [key, value] of Object.entries(parsed)) {
      const platform = PLATFORM_ALIASES[key.toLowerCase()]
      if (platform && typeof value === 'string') entries.push({ platform, value })
    }
    return entries
  } catch {
    // Not JSON — the free-text format
    return null
  }
}

/**
 * One free-text line as an entry: "platform: value" / "platform - value" / "platform value",
 * else a bare URL whose hostname names the platform. Null for a blank, unknown or malformed line.
 */
function lineEntry(line: string): Entry | null {
  const entry = line.trim()
  if (!entry) return null

  const [, label, labelledValue] = entry.match(/^([a-z]+)\s*[:\-=]?\s+(.+)$/i) ?? []
  if (label && labelledValue) {
    const platform = PLATFORM_ALIASES[label.toLowerCase()]
    if (platform) return { platform, value: labelledValue }
  }

  const urlMatch = entry.match(/https?:\/\/[^\s]+/i)
  if (!urlMatch) return null
  try {
    const platform = detectPlatformFromHost(new URL(urlMatch[0]).host)
    return platform ? { platform, value: urlMatch[0] } : null
  } catch {
    // ignore malformed URL
    return null
  }
}

/**
 * Parses the `Restaurant.socialMedia` column into per-platform handles.
 *
 * Accepts either:
 *  - a JSON object: `{"instagram": "foo", "facebook": "bar", "twitter": "baz"}`
 *  - free text, one entry per line, each being a profile URL
 *    (`https://www.instagram.com/foo`) or `platform: value` (`instagram: @foo`)
 *
 * The first value seen for a platform wins. Never throws — anything unrecognized is ignored.
 */
export function parseSocialMedia(raw: string | null | undefined): SocialHandles {
  if (!raw || !raw.trim()) return { ...EMPTY }

  const result: SocialHandles = { ...EMPTY }

  const assign = ({ platform, value }: Entry) => {
    if (result[platform]) return
    const handle = toHandle(value)
    if (handle) result[platform] = handle
  }

  const json = jsonEntries(raw)
  if (json) {
    json.forEach(assign)
    return result
  }

  for (const line of raw.split(/\r?\n/)) {
    const entry = lineEntry(line)
    if (entry) assign(entry)
  }

  return result
}
