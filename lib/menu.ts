// lib/menu.ts
// Shared shapes and vocabulary for the customer-facing menu.

/** The two guest languages; every bilingual column is `<field>En` / `<field>Fr` and the restaurant picks the default. */
export type Locale = 'en' | 'fr'
/** The theme forced on the public menu; 'system' follows the device, the other two are applied as a class on the .brand-scope wrapper. */
export type MenuTheme = 'system' | 'light' | 'dark'
/** How the cover image fills the hero: one photo scaled to cover it, or a small pattern tiled. */
export type CoverStyle = 'cover' | 'repeat'

/** An ingredient as the dish sheet lists it; serializeDish (lib/menu-data) builds it from the Ingredient row. */
export interface MenuIngredient {
  id: string
  nameEn: string
  nameFr: string
}

/** A dish as the customer pages render it: the plain output of serializeDish (lib/menu-data), safe to pass to a client component. */
export interface MenuDish {
  id: string
  nameEn: string
  nameFr: string
  descriptionEn: string | null
  descriptionFr: string | null
  /** An exact two-fraction-digit decimal string, beside the restaurant's ISO 4217 code (API.1); never a float. */
  price: string
  imageUrl: string
  usdzUrl: string | null
  glbUrl: string | null
  calories: number | null
  isMostPurchased: boolean
  dietary: string[]
  allergens: string[]
  ingredients: MenuIngredient[]
}

/** A subcategory with its dishes already serialized; one node of the tree serializeCategories builds. */
export interface MenuSubcategory {
  id: string
  nameEn: string
  nameFr: string
  dishes: MenuDish[]
}

/** A top-level menu section with its subcategories; the tree serializeCategories builds from the Prisma include. */
export interface MenuCategory {
  id: string
  nameEn: string
  nameFr: string
  subcategories: MenuSubcategory[]
}

/** The restaurant as the public pages see it: serializeRestaurant's output, the enum-like columns already coerced and the JSON columns still raw strings. */
export interface MenuRestaurant {
  id: string
  name: string
  slug: string
  tagline: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  coverImageStyle: CoverStyle
  menuTheme: MenuTheme
  colorTheme: string | null
  defaultLocale: Locale
  fontFamily: string | null
  googleFontUrl: string | null
  currencySymbol: string
  /** ISO 4217 code when known (EUR, MAD, USD…); prices then use Intl formatting */
  currency: string | null
  cuisineType: string | null
  city: string | null
  streetAddress: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  openingHours: string | null
  socialMedia: string | null
}

/** Dietary attributes a restaurant can set on a dish. Keys are what is stored. */
export const DIETARY_OPTIONS = [
  { key: 'vegetarian', en: 'Vegetarian', fr: 'Végétarien' },
  { key: 'vegan', en: 'Vegan', fr: 'Végan' },
  { key: 'halal', en: 'Halal', fr: 'Halal' },
  { key: 'gluten_free', en: 'Gluten-free', fr: 'Sans gluten' },
  { key: 'spicy', en: 'Spicy', fr: 'Épicé' },
] as const

/** Allergens a dish can declare. Keys are what is stored. */
export const ALLERGEN_OPTIONS = [
  { key: 'gluten', en: 'Gluten', fr: 'Gluten' },
  { key: 'nuts', en: 'Nuts', fr: 'Fruits à coque' },
  { key: 'dairy', en: 'Dairy', fr: 'Lait' },
  { key: 'eggs', en: 'Eggs', fr: 'Œufs' },
  { key: 'fish', en: 'Fish', fr: 'Poisson' },
  { key: 'shellfish', en: 'Shellfish', fr: 'Crustacés' },
  { key: 'soy', en: 'Soy', fr: 'Soja' },
  { key: 'sesame', en: 'Sesame', fr: 'Sésame' },
] as const

/** The label in the guest's language, or the key itself for one not in DIETARY_OPTIONS, so a stale row shows something rather than nothing. */
export function dietaryLabel(key: string, locale: Locale): string {
  const opt = DIETARY_OPTIONS.find((o) => o.key === key)
  return opt ? opt[locale] : key
}

/** The label in the guest's language, or the key itself for one not in ALLERGEN_OPTIONS, so a stale row shows something rather than nothing. */
export function allergenLabel(key: string, locale: Locale): string {
  const opt = ALLERGEN_OPTIONS.find((o) => o.key === key)
  return opt ? opt[locale] : key
}

/** A category or subcategory name in the guest's language. */
export const localName = (locale: Locale, en: string, fr: string) => (locale === 'fr' ? fr : en)

/** Whether the AR button appears at all: either model format counts, and an empty string is not a URL. */
export function hasAR(dish: Pick<MenuDish, 'usdzUrl' | 'glbUrl'>): boolean {
  return Boolean(dish.usdzUrl || dish.glbUrl)
}

/** What formatPrice needs beside the amount: the guest's locale and the restaurant's symbol and ISO code; each page builds one from MenuRestaurant. */
export interface Money {
  locale: Locale
  symbol: string
  code: string | null
}

/** Locale-aware price: "12,99 €" in French, "€12.99" in English; falls back to the stored symbol. */
export function formatPrice(price: string, money: Money): string {
  const amount = Number(price)
  if (money.code && /^[A-Z]{3}$/.test(money.code)) {
    try {
      return new Intl.NumberFormat(money.locale === 'fr' ? 'fr-FR' : 'en-GB', {
        style: 'currency',
        currency: money.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      // unknown code: fall through
    }
  }
  const n = new Intl.NumberFormat(money.locale === 'fr' ? 'fr-FR' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
  return money.locale === 'fr' ? `${n} ${money.symbol}` : `${money.symbol}${n}`
}

/** The localStorage key of the guest's remembered language, one for every restaurant's menu on the origin; read second, after `?lang=`. */
export const LOCALE_STORAGE_KEY = 'foodify-menu-locale'

/** Pick the first language: ?lang=, then a remembered choice, then the browser, then the restaurant default. */
export function resolveInitialLocale(defaultLocale: Locale, urlLang?: string | null): Locale {
  if (urlLang === 'en' || urlLang === 'fr') return urlLang
  if (typeof window !== 'undefined') {
    // A page served from the offline cache carries no query on the server side; read it here too.
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl === 'en' || fromUrl === 'fr') return fromUrl
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
      if (stored === 'en' || stored === 'fr') return stored
    } catch {
      // storage unavailable
    }
    const nav = (window.navigator.language || '').toLowerCase()
    if (nav.startsWith('fr')) return 'fr'
    if (nav.startsWith('en')) return 'en'
  }
  return defaultLocale
}

/** UI strings for the customer pages. Restaurant content is bilingual in the data; this covers the chrome. */
export const MENU_TEXT = {
  en: {
    search: 'Search menu',
    filters: 'Filters',
    ar: 'AR',
    arOnly: 'Show only dishes with AR',
    dietary: 'Dietary',
    clear: 'Clear filters',
    done: 'Done',
    noResults: 'No dishes match',
    noResultsHint: 'Try another word or clear the filters.',
    seeOnTable: 'See it on your table',
    openingAR: 'Opening AR…',
    ingredients: 'Ingredients',
    contains: 'Contains',
    kcal: 'kcal',
    popular: 'Popular',
    backToMenu: 'Back to menu',
    share: 'Share',
    linkCopied: 'Link copied',
    dishes: 'dishes',
    dish: 'dish',
    hours: 'Opening hours',
    contact: 'Contact',
    follow: 'Follow',
    directions: 'Directions',
    poweredBy: 'Menu by',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    openNow: 'Open',
    closedNow: 'Closed',
    closes: 'closes',
    opens: 'opens',
    skipToMenu: 'Skip to menu',
    categories: 'Categories',
    results: (n: number) => (n === 1 ? '1 dish matches' : `${n} dishes match`),
    shareMenu: 'Share this menu',
    install: 'Add to home screen',
    installHint: 'Opens like an app, works without signal.',
    offline: 'You are offline — showing the menu as it was last loaded.',
    menuOf: (name: string) => `Menu of ${name}`,
    installIos: 'On iPhone: tap Share, then “Add to Home Screen”.',
    offlineReady: 'Saved on this device — opens without signal.',
    updateAvailable: 'This menu has been updated.',
    refresh: 'Refresh',
  },
  fr: {
    search: 'Rechercher',
    filters: 'Filtres',
    ar: 'RA',
    arOnly: 'Afficher uniquement les plats en RA',
    dietary: 'Régime',
    clear: 'Effacer les filtres',
    done: 'OK',
    noResults: 'Aucun plat ne correspond',
    noResultsHint: 'Essayez un autre mot ou effacez les filtres.',
    seeOnTable: 'Voir sur votre table',
    openingAR: 'Ouverture de la RA…',
    ingredients: 'Ingrédients',
    contains: 'Contient',
    kcal: 'kcal',
    popular: 'Populaire',
    backToMenu: 'Retour au menu',
    share: 'Partager',
    linkCopied: 'Lien copié',
    dishes: 'plats',
    dish: 'plat',
    hours: "Horaires d'ouverture",
    contact: 'Contact',
    follow: 'Suivre',
    directions: 'Itinéraire',
    poweredBy: 'Menu par',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    openNow: 'Ouvert',
    closedNow: 'Fermé',
    closes: 'ferme à',
    opens: 'ouvre à',
    skipToMenu: 'Aller au menu',
    categories: 'Catégories',
    results: (n: number) => (n === 1 ? '1 plat correspond' : `${n} plats correspondent`),
    shareMenu: 'Partager ce menu',
    install: 'Ajouter à l’écran d’accueil',
    installHint: 'S’ouvre comme une app, fonctionne sans réseau.',
    offline: 'Vous êtes hors ligne — menu affiché tel qu’il a été chargé.',
    menuOf: (name: string) => `Menu de ${name}`,
    installIos: 'Sur iPhone : touchez Partager, puis « Sur l’écran d’accueil ».',
    offlineReady: 'Enregistré sur cet appareil — s’ouvre sans réseau.',
    updateAvailable: 'Ce menu a été mis à jour.',
    refresh: 'Actualiser',
  },
} as const
