// lib/social.ts
// The social networks a restaurant can link, as one extensible registry: the menu footer, the
// settings form and the parser all read it, so adding a network is one entry here. Each stores a
// bare handle where a network has one (Instagram, TikTok, …), a phone number for WhatsApp, or the
// whole URL for a network with no clean handle scheme (Tripadvisor). `parseSocialMedia` turns the
// stored `Restaurant.socialMedia` value (JSON, or the legacy free text) into those per network,
// and `socialUrl` builds the public link.

type Kind = 'handle' | 'phone' | 'url'

/** One social network in the registry: how its stored value reads, how to recognise it, and how to build its public URL. */
export interface SocialNetwork {
  key: string
  label: string
  /** How the stored value reads: a bare handle, a phone number (digits), or a full URL. */
  kind: Kind
  /** Names accepted at the start of a "network: value" line, lowercase. */
  aliases: string[]
  /** Hostnames whose URL identifies this network (without a leading www.). */
  hosts: string[]
  /** The public URL from the stored value. */
  url: (value: string) => string
  placeholder: string
}

const handleUrl = (base: string, at = false) => (h: string) => `${base}/${at ? '@' : ''}${h.replace(/^@/, '')}`

/** Every network a restaurant can link, in the order the form lists them; add a network by adding an entry. */
export const SOCIAL_NETWORKS: readonly SocialNetwork[] = [
  { key: 'instagram', label: 'Instagram', kind: 'handle', aliases: ['instagram', 'insta', 'ig'], hosts: ['instagram.com'], url: handleUrl('https://instagram.com'), placeholder: '@yourrestaurant or a profile link' },
  { key: 'facebook', label: 'Facebook', kind: 'handle', aliases: ['facebook', 'fb'], hosts: ['facebook.com', 'fb.com'], url: handleUrl('https://facebook.com'), placeholder: 'yourpage or a page link' },
  { key: 'twitter', label: 'X (Twitter)', kind: 'handle', aliases: ['twitter', 'x'], hosts: ['twitter.com', 'x.com'], url: handleUrl('https://x.com'), placeholder: '@yourrestaurant or a profile link' },
  { key: 'tiktok', label: 'TikTok', kind: 'handle', aliases: ['tiktok', 'tt'], hosts: ['tiktok.com'], url: handleUrl('https://tiktok.com', true), placeholder: '@yourrestaurant or a profile link' },
  { key: 'youtube', label: 'YouTube', kind: 'handle', aliases: ['youtube', 'yt'], hosts: ['youtube.com', 'youtu.be'], url: handleUrl('https://youtube.com', true), placeholder: '@yourchannel or a channel link' },
  { key: 'pinterest', label: 'Pinterest', kind: 'handle', aliases: ['pinterest', 'pin'], hosts: ['pinterest.com'], url: handleUrl('https://pinterest.com'), placeholder: 'yourrestaurant or a profile link' },
  { key: 'snapchat', label: 'Snapchat', kind: 'handle', aliases: ['snapchat', 'snap'], hosts: ['snapchat.com'], url: (h) => `https://snapchat.com/add/${h.replace(/^@/, '')}`, placeholder: 'yourrestaurant or an add link' },
  { key: 'whatsapp', label: 'WhatsApp', kind: 'phone', aliases: ['whatsapp', 'wa'], hosts: ['wa.me', 'whatsapp.com', 'api.whatsapp.com'], url: (n) => `https://wa.me/${n.replace(/\D/g, '')}`, placeholder: 'phone number with country code' },
  { key: 'tripadvisor', label: 'Tripadvisor', kind: 'url', aliases: ['tripadvisor', 'ta'], hosts: ['tripadvisor.com', 'tripadvisor.co.uk', 'tripadvisor.fr', 'tripadvisor.be', 'tripadvisor.nl'], url: (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`), placeholder: 'your Tripadvisor page link' },
]

const BY_KEY = new Map(SOCIAL_NETWORKS.map((n) => [n.key, n]))
const BY_ALIAS = new Map(SOCIAL_NETWORKS.flatMap((n) => n.aliases.map((a) => [a, n] as const)))

/** A network's key ('instagram', 'whatsapp', …). */
export type SocialKey = (typeof SOCIAL_NETWORKS)[number]['key']
/** Every network's stored value, null when unset: what `parseSocialMedia` returns and the footer turns into links. */
export type SocialHandles = Record<SocialKey, string | null>

const EMPTY: SocialHandles = Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, null])) as SocialHandles

/** The network a hostname belongs to, or null; `www.` and a trailing path are ignored. */
function networkForHost(host: string): SocialNetwork | null {
  const h = host.toLowerCase().replace(/^www\./, '')
  return SOCIAL_NETWORKS.find((n) => n.hosts.some((d) => h === d || h.endsWith(`.${d}`))) ?? null
}

/** The stored value for a network from a raw entry (a handle, "@handle", a phone, or a full URL). */
function normalize(network: SocialNetwork, value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (network.kind === 'url') return /^https?:\/\//i.test(v) ? v : `https://${v}`
  if (/^https?:\/\//i.test(v)) {
    try {
      const first = new URL(v).pathname.split('/').filter(Boolean)[0]
      value = first ?? ''
    } catch {
      return null
    }
  }
  if (network.kind === 'phone') {
    const digits = value.replace(/\D/g, '')
    return digits || null
  }
  return value.trim().replace(/^@/, '') || null
}

type Entry = { network: SocialNetwork; value: string }

/** The entries of the JSON object format, keyed by network key or alias; null when the text is not a JSON object. */
function jsonEntries(raw: string): Entry[] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const entries: Entry[] = []
    for (const [key, value] of Object.entries(parsed)) {
      const network = BY_KEY.get(key.toLowerCase()) ?? BY_ALIAS.get(key.toLowerCase())
      if (network && typeof value === 'string') entries.push({ network, value })
    }
    return entries
  } catch {
    return null
  }
}

/** One free-text line as an entry: "network: value" / "network value", else a URL whose host names the network. */
function lineEntry(line: string): Entry | null {
  const entry = line.trim()
  if (!entry) return null
  const [, label, labelledValue] = entry.match(/^([a-z]+)\s*[:\-=]?\s+(.+)$/i) ?? []
  if (label && labelledValue) {
    const network = BY_ALIAS.get(label.toLowerCase())
    if (network) return { network, value: labelledValue }
  }
  const urlMatch = entry.match(/https?:\/\/[^\s]+/i)
  if (!urlMatch) return null
  try {
    const network = networkForHost(new URL(urlMatch[0]).host)
    return network ? { network, value: urlMatch[0] } : null
  } catch {
    return null
  }
}

/**
 * Parses `Restaurant.socialMedia` into per-network stored values. Accepts a JSON object
 * (`{"instagram":"foo","whatsapp":"+3312…"}`) or the legacy free text, one entry per line
 * (a profile URL or `network: value`). The first value seen for a network wins; never throws.
 */
export function parseSocialMedia(raw: string | null | undefined): SocialHandles {
  if (!raw || !raw.trim()) return { ...EMPTY }
  const result: SocialHandles = { ...EMPTY }
  const assign = ({ network, value }: Entry) => {
    if (result[network.key]) return
    const stored = normalize(network, value)
    if (stored) result[network.key] = stored
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

/** The public URL for a network's stored value. */
export function socialUrl(key: SocialKey, value: string): string {
  return (BY_KEY.get(key) ?? SOCIAL_NETWORKS[0]!).url(value)
}
