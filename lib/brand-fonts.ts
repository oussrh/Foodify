// lib/brand-fonts.ts
// Curated Google Fonts a restaurant can pick for its public menu. Kept short on purpose:
// a menu needs one readable face, and every option here has been checked at 15px on a phone.

export type FontCategory = 'sans' | 'serif' | 'display'

export interface BrandFont {
  family: string
  category: FontCategory
  /** Stylesheet URL stored on the restaurant (what the public page loads) */
  url: string
  /** Short note shown in the picker */
  note: string
}

const gf = (family: string, axes = 'wght@400;500;600;700') =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axes}&display=swap`

export const BRAND_FONTS: BrandFont[] = [
  { family: 'Inter', category: 'sans', url: gf('Inter'), note: 'Neutral, very legible' },
  { family: 'Manrope', category: 'sans', url: gf('Manrope'), note: 'Geometric, modern' },
  { family: 'DM Sans', category: 'sans', url: gf('DM Sans'), note: 'Friendly, rounded' },
  { family: 'Nunito', category: 'sans', url: gf('Nunito'), note: 'Soft, casual' },
  { family: 'Poppins', category: 'sans', url: gf('Poppins'), note: 'Bold, geometric' },
  { family: 'Source Sans 3', category: 'sans', url: gf('Source Sans 3'), note: 'Quiet, editorial' },
  { family: 'Lora', category: 'serif', url: gf('Lora'), note: 'Warm, classic' },
  { family: 'Playfair Display', category: 'serif', url: gf('Playfair Display'), note: 'Elegant, high contrast' },
  { family: 'Cormorant Garamond', category: 'serif', url: gf('Cormorant Garamond', 'wght@400;500;600;700'), note: 'Fine dining' },
  { family: 'Fraunces', category: 'serif', url: gf('Fraunces', 'opsz,wght@9..144,400;9..144,600;9..144,700'), note: 'Characterful' },
  { family: 'Oswald', category: 'display', url: gf('Oswald', 'wght@400;500;600;700'), note: 'Condensed, bold' },
  { family: 'Bebas Neue', category: 'display', url: gf('Bebas Neue', 'wght@400'), note: 'Signage' },
]

/** One stylesheet that loads every option, for previewing the picker. */
export const BRAND_FONTS_PREVIEW_URL =
  'https://fonts.googleapis.com/css2?' +
  BRAND_FONTS.map((f) => f.url.split('?family=')[1].split('&display')[0]).map((p) => 'family=' + p).join('&') +
  '&display=swap'

export function findBrandFont(family: string | null | undefined): BrandFont | undefined {
  if (!family) return undefined
  return BRAND_FONTS.find((f) => f.family.toLowerCase() === family.toLowerCase())
}
