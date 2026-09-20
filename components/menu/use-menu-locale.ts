'use client'

import { useState } from 'react'
import { LOCALE_STORAGE_KEY, resolveInitialLocale, type Locale } from '@/lib/menu'
import { useClientValue } from '@/components/use-client-value'

/**
 * The guest's language on a menu page: the URL's or the restaurant's on the server and during
 * hydration, then the remembered choice and the browser (`resolveInitialLocale`); a choice made on
 * the page overrides both and is remembered for the next visit.
 */
export function useMenuLocale(defaultLocale: Locale, urlLang?: string | null): [Locale, (next: Locale) => void] {
  const detected = useClientValue(
    () => resolveInitialLocale(defaultLocale, urlLang),
    urlLang === 'fr' || urlLang === 'en' ? urlLang : defaultLocale,
  )
  const [chosen, setChosen] = useState<Locale | null>(null)
  const choose = (next: Locale) => {
    setChosen(next)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      // storage unavailable
    }
  }
  return [chosen ?? detected, choose]
}
