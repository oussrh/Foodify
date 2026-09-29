// components/menu/language-switch.tsx
// The guest's EN | FR switch, in the menu's bar and on every menu sub-page. Each button names its
// language in that language, so a guest who reads neither label's abbreviation still finds theirs.
'use client'

import { cn } from '@/lib/utils'
import { type Locale } from '@/lib/menu'

const LOCALES: Locale[] = ['en', 'fr']

/** Two pressed-state buttons, one per menu language. */
export default function LanguageSwitch({ locale, onLocale }: { locale: Locale; onLocale: (next: Locale) => void }) {
  return (
    <div role="group" aria-label="Language / Langue" className="flex h-10 shrink-0 rounded-md border border-input bg-card p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => onLocale(l)}
          aria-pressed={locale === l}
          aria-label={l === 'en' ? 'English' : 'Français'}
          className={cn(
            'rounded-[4px] px-2.5 text-xs font-semibold uppercase transition-colors',
            locale === l ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
