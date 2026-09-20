// lib/menu.ts
// Shared shapes and vocabulary for the customer-facing menu.

export type Locale = 'en' | 'fr'
export type MenuTheme = 'system' | 'light' | 'dark'
export type CoverStyle = 'cover' | 'repeat'

export interface MenuIngredient {
  id: string
  nameEn: string
  nameFr: string
}

export interface MenuDish {
  id: string
  nameEn: string
  nameFr: string
  descriptionEn: string | null
  descriptionFr: string | null
  price: number
  imageUrl: string
  usdzUrl: string | null
  glbUrl: string | null
  calories: number | null
  isMostPurchased: boolean
  dietary: string[]
  allergens: string[]
  ingredients: MenuIngredient[]
}

export interface MenuSubcategory {
  id: string
  nameEn: string
  nameFr: string
  dishes: MenuDish[]
}

export interface MenuCategory {
  id: string
  nameEn: string
  nameFr: string
  subcategories: MenuSubcategory[]
}

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

export function dietaryLabel(key: string, locale: Locale): string {
  const opt = DIETARY_OPTIONS.find((o) => o.key === key)
  return opt ? opt[locale] : key
}

export function allergenLabel(key: string, locale: Locale): string {
  const opt = ALLERGEN_OPTIONS.find((o) => o.key === key)
  return opt ? opt[locale] : key
}

export function hasAR(dish: Pick<MenuDish, 'usdzUrl' | 'glbUrl'>): boolean {
  return Boolean(dish.usdzUrl || dish.glbUrl)
}

export function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toFixed(2)}`
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
  },
} as const

export type MenuText = (typeof MENU_TEXT)['en']
