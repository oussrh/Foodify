// components/restaurant-form/settings-tabs.tsx
// The settings form's three sections, the Integrations tab beside them, and their tab strip: which fields each section holds
// (the tab that has a failing field shows a dot, and the submit switches to the first one),
// the tablist itself, and at its end the link to the public menu as guests see it (a new tab,
// the saved slug: what is on the page is what is saved, not what the form holds).
'use client'

import type { FieldErrors } from 'react-hook-form'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditRestaurantValues } from './edit-restaurant-schema'

export type SettingsTab = 'general' | 'contact' | 'branding' | 'integrations'

export const TABS: { key: SettingsTab; label: string; fields: (keyof EditRestaurantValues)[] }[] = [
  {
    key: 'general',
    label: 'General',
    fields: ['name', 'slug', 'tagline', 'description', 'cuisineType', 'dietaryOptions', 'currency', 'currencySymbol', 'defaultLocale', 'timeZone'],
  },
  {
    key: 'contact',
    label: 'Contact & hours',
    fields: ['email', 'phone', 'website', 'streetAddress', 'city', 'state', 'postalCode', 'country', 'openingHours', 'socialMedia', 'socialDisplay'],
  },
  {
    key: 'branding',
    label: 'Branding',
    fields: ['logoUrl', 'colorTheme', 'coverImageUrl', 'coverImageStyle', 'fontFamily', 'googleFontUrl', 'menuTheme'],
  },
  // Not part of the form: the POS panel saves each step on its own (components/pos/).
  { key: 'integrations', label: 'Integrations', fields: [] },
]

/**
 * The settings form's tab strip: a dot marks a tab holding a failing field, and the trailing link
 * opens the public menu at the saved slug, not the one being edited.
 */
export default function SettingsTabs({
  activeTab,
  errors,
  onSelect,
  slug,
}: {
  activeTab: SettingsTab
  errors: FieldErrors<EditRestaurantValues>
  onSelect: (tab: SettingsTab) => void
  /** The saved slug: the public menu the preview opens. */
  slug: string
}) {
  return (
    <div className="scrollbar-none -mx-4 flex items-stretch gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
    <div role="tablist" aria-label="Settings sections" className="flex gap-1">
      {TABS.map((tab) => {
        const hasError = tab.fields.some((field) => field in errors)
        const active = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`settings-tab-${tab.key}`}
            aria-selected={active}
            aria-controls={`settings-panel-${tab.key}`}
            onClick={() => onSelect(tab.key)}
            className={cn(
              '-mb-px flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
              active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {hasError && <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-label="Has errors" />}
          </button>
        )
      })}
    </div>
    {/* `relative`: its sr-only note is absolutely placed, and without it that note sits outside
        this scroll strip, where it widens the whole page once the tabs overflow a phone. */}
    <a
      href={`/restaurant/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative -mb-px ml-auto flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
      Preview menu
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
    </div>
  )
}
