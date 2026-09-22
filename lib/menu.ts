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
  imageUrl: string | null
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
  /** How the footer shows the social links: 'icons' or 'text'. */
  socialDisplay: 'icons' | 'text'
  /** The dietary keys this restaurant offers (Settings → General): the filter chips, and the only tags a dish shows. */
  dietaryOptions: string[]
  /** Settings → General: the menu shows the cart and sends orders to POST /api/orders; off, the menu is for reading. */
  orderingEnabled: boolean
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

/** The dietary options a restaurant offers, in the vocabulary's order; a key outside the vocabulary is dropped. */
export function offeredDietary(keys: readonly string[]) {
  return DIETARY_OPTIONS.filter((o) => keys.includes(o.key))
}

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
    photo: 'Photo',
    model3d: '3D',
    view3d: 'View in 3D',
    viewPhoto: 'View the photo',
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
    addToOrder: 'Add to order',
    add: (name: string) => `Add ${name}`,
    oneLess: (name: string) => `One less ${name}`,
    oneMore: (name: string) => `One more ${name}`,
    quantityOf: (name: string) => `Quantity of ${name}`,
    inOrder: (n: number) => `${n} in your order`,
    remove: (name: string) => `Remove ${name}`,
    addNote: 'Add a note',
    noteFor: (name: string) => `Note for ${name}`,
    notePlaceholder: 'No onions, well done…',
    saveNote: 'Done',
    viewOrder: 'View order',
    yourOrder: 'Your order',
    items: (n: number) => (n === 1 ? '1 item' : `${n} items`),
    emptyOrder: 'Nothing in your order yet. Add dishes from the menu.',
    subtotal: 'Subtotal',
    tableNumber: 'Table number',
    tableHint: 'Written on your table or on the QR code.',
    tableFromQr: 'From the QR code on your table.',
    phoneNumber: 'Phone number',
    phoneHint: 'We text you the confirmation of your order.',
    phoneRequired: 'Enter a phone number we can text.',
    orderNote: 'Note for the kitchen (optional)',
    placeOrder: 'Place order',
    sendingOrder: 'Sending…',
    orderSent: (n: number) => `Order #${n} sent`,
    orderSentHint: (table: string) => `The kitchen has it and will bring it to table ${table}.`,
    orderFailed: 'The order could not be sent. Check your connection and try again.',
    orderingOff: 'This restaurant is not taking orders right now.',
    menuChanged: 'The menu has changed since you picked a dish. Check your order and try again.',
    tableRequired: 'Enter your table number.',
  },
  fr: {
    search: 'Rechercher',
    filters: 'Filtres',
    ar: 'RA',
    photo: 'Photo',
    model3d: '3D',
    view3d: 'Voir en 3D',
    viewPhoto: 'Voir la photo',
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
    addToOrder: 'Ajouter à la commande',
    add: (name: string) => `Ajouter ${name}`,
    oneLess: (name: string) => `Un ${name} de moins`,
    oneMore: (name: string) => `Un ${name} de plus`,
    quantityOf: (name: string) => `Quantité de ${name}`,
    inOrder: (n: number) => `${n} dans votre commande`,
    remove: (name: string) => `Retirer ${name}`,
    addNote: 'Ajouter une note',
    noteFor: (name: string) => `Note pour ${name}`,
    notePlaceholder: 'Sans oignons, bien cuit…',
    saveNote: 'OK',
    viewOrder: 'Voir la commande',
    yourOrder: 'Votre commande',
    items: (n: number) => (n === 1 ? '1 article' : `${n} articles`),
    emptyOrder: 'Rien dans votre commande pour l’instant. Ajoutez des plats depuis le menu.',
    subtotal: 'Sous-total',
    tableNumber: 'Numéro de table',
    tableHint: 'Indiqué sur votre table ou sur le QR code.',
    tableFromQr: 'Depuis le QR code de votre table.',
    phoneNumber: 'Numéro de téléphone',
    phoneHint: 'Nous vous envoyons la confirmation de votre commande par SMS.',
    phoneRequired: 'Indiquez un numéro de téléphone.',
    orderNote: 'Note pour la cuisine (facultatif)',
    placeOrder: 'Commander',
    sendingOrder: 'Envoi…',
    orderSent: (n: number) => `Commande n° ${n} envoyée`,
    orderSentHint: (table: string) => `La cuisine l’a reçue et l’apportera à la table ${table}.`,
    orderFailed: 'La commande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.',
    orderingOff: 'Ce restaurant ne prend pas de commandes pour le moment.',
    menuChanged: 'Le menu a changé depuis votre choix. Vérifiez votre commande et réessayez.',
    tableRequired: 'Indiquez votre numéro de table.',
  },
} as const
