// components/social-icons.tsx
// The three brand glyphs the menu footer and the contact panel show. Lucide dropped brand
// logos in 1.0; these are the Lucide 0.525 shapes (ISC licence, https://lucide.dev), drawn
// with the same 24-unit grid, stroke and props as a Lucide icon so `className` works alike.
import type { ReactElement, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Glyph({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/**
 * The Instagram glyph, stroked like a Lucide icon (the Lucide 0.525 shape) so `className` sizes and
 * colours it the same way.
 */
export function Instagram(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Glyph>
  )
}

/**
 * The Facebook glyph, stroked like a Lucide icon (the Lucide 0.525 shape) so `className` sizes and
 * colours it the same way.
 */
export function Facebook(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Glyph>
  )
}

/**
 * The Twitter bird glyph, stroked like a Lucide icon (the Lucide 0.525 shape) so `className` sizes
 * and colours it the same way.
 */
export function Twitter(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </Glyph>
  )
}

/** The shape every glyph here (and a Lucide icon) has: a component taking SVG props. */
export type SocialIcon = (props: IconProps) => ReactElement

// A solid brand mark: same 24-grid, filled with currentColor rather than stroked.
function Solid({ children, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

/** The TikTok mark, solid in currentColor on the 24-unit grid. */
export function TikTok(props: IconProps) {
  return (
    <Solid {...props}>
      <path d="M16.5 3c.3 2 1.6 3.6 3.5 3.9v2.6c-1.3.1-2.5-.3-3.6-1v5.9a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v2.7a3.3 3.3 0 1 0 2.3 3.1V3z" />
    </Solid>
  )
}

/** The YouTube mark, solid in currentColor on the 24-unit grid. */
export function YouTube(props: IconProps) {
  return (
    <Solid {...props}>
      <path d="M23 12s0-3.1-.4-4.6a2.4 2.4 0 0 0-1.7-1.7C19.4 5.3 12 5.3 12 5.3s-7.4 0-8.9.4A2.4 2.4 0 0 0 1.4 7.4C1 8.9 1 12 1 12s0 3.1.4 4.6a2.4 2.4 0 0 0 1.7 1.7c1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4a2.4 2.4 0 0 0 1.7-1.7C23 15.1 23 12 23 12zM9.8 15V9l5.2 3z" />
    </Solid>
  )
}

/** The Pinterest mark, solid in currentColor on the 24-unit grid. */
export function Pinterest(props: IconProps) {
  return (
    <Solid {...props}>
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2.9.5 1.7 1.4 1.7 1.7 0 2.9-2.2 2.9-4.7 0-1.9-1.3-3.4-3.7-3.4a4.3 4.3 0 0 0-4.5 4.3c0 .8.3 1.4.6 1.8.2.2.2.3.1.5l-.2.8c0 .3-.2.3-.5.2-1.3-.5-1.9-2-1.9-3.6 0-2.7 2.2-5.9 6.7-5.9 3.6 0 5.9 2.6 5.9 5.3 0 3.6-2 6.4-5 6.4-1 0-2-.6-2.3-1.2l-.6 2.4c-.2.8-.7 1.8-1.1 2.4A10 10 0 1 0 12 2z" />
    </Solid>
  )
}

/** The Snapchat mark, solid in currentColor on the 24-unit grid. */
export function Snapchat(props: IconProps) {
  return (
    <Solid {...props}>
      <path d="M12 2c2.6 0 4.3 2 4.4 4.5 0 .6 0 1.3-.1 1.9.4.2.9.1 1.3-.1.6-.2 1.3.6.8 1.3-.4.5-1.2.7-1.8 1-.3.1-.4.3-.3.6.5 1.6 2 2.9 3.6 3.3.5.1.6.7.2 1-.7.5-1.6.7-2.4.9-.2 0-.3.2-.3.4-.1.6-.5.7-1 .6-.7-.1-1.4-.2-2 .1-.6.2-1 .9-1.6 1.2-1 .5-2.3.5-3.3 0-.6-.3-1-1-1.6-1.2-.6-.3-1.3-.2-2-.1-.5.1-.9 0-1-.6 0-.2-.1-.4-.3-.4-.8-.2-1.7-.4-2.4-.9-.4-.3-.3-.9.2-1 1.6-.4 3.1-1.7 3.6-3.3.1-.3 0-.5-.3-.6-.6-.3-1.4-.5-1.8-1-.5-.7.2-1.5.8-1.3.4.2.9.3 1.3.1-.1-.6-.1-1.3-.1-1.9C7.7 4 9.4 2 12 2z" />
    </Solid>
  )
}

/** The WhatsApp mark, solid in currentColor on the 24-unit grid. */
export function WhatsApp(props: IconProps) {
  return (
    <Solid {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4 0-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.7 2.6 4.1 3.6 1.5.6 2 .7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z" />
    </Solid>
  )
}

/** The Tripadvisor mark, solid in currentColor on the 24-unit grid. */
export function Tripadvisor(props: IconProps) {
  return (
    <Solid {...props}>
      <path d="M12 7C8.6 7 5.5 8 3 9.8L1 9.8l1.3 1.5A4.7 4.7 0 0 0 6 19a4.6 4.6 0 0 0 3.4-1.5l1.6 1.8 1.6-1.8A4.6 4.6 0 0 0 16 19a4.7 4.7 0 0 0 3.7-7.7L21 9.8h-1.9A16 16 0 0 0 12 7zM6 17a2.7 2.7 0 1 1 0-5.4A2.7 2.7 0 0 1 6 17zm0-4a1.3 1.3 0 1 0 0 2.6A1.3 1.3 0 0 0 6 13zm10 4a2.7 2.7 0 1 1 0-5.4A2.7 2.7 0 0 1 16 17zm0-4a1.3 1.3 0 1 0 0 2.6A1.3 1.3 0 0 0 16 13z" />
    </Solid>
  )
}

/** The glyph for each social network key (lib/social keeps the registry icon-free so it stays a leaf). */
export const SOCIAL_ICONS: Record<string, SocialIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  tiktok: TikTok,
  youtube: YouTube,
  pinterest: Pinterest,
  snapchat: Snapchat,
  whatsapp: WhatsApp,
  tripadvisor: Tripadvisor,
}
