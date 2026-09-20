// components/restaurant-form/settings-tabs.tsx
// The settings form's three sections and their tab strip: which fields each section holds
// (the tab that has a failing field shows a dot, and the submit switches to the first one),
// and the tablist itself.
'use client'

import type { FieldErrors } from 'react-hook-form'
import { cn } from '@/lib/utils'
import type { EditRestaurantValues } from './edit-restaurant-schema'

export type SettingsTab = 'general' | 'contact' | 'branding'

export const TABS: { key: SettingsTab; label: string; fields: (keyof EditRestaurantValues)[] }[] = [
  {
    key: 'general',
    label: 'General',
    fields: ['name', 'slug', 'tagline', 'description', 'cuisineType', 'priceRange', 'currency', 'currencySymbol', 'defaultLocale'],
  },
  {
    key: 'contact',
    label: 'Contact & hours',
    fields: ['email', 'phone', 'website', 'streetAddress', 'city', 'state', 'postalCode', 'country', 'openingHours', 'socialMedia'],
  },
  {
    key: 'branding',
    label: 'Branding',
    fields: ['logoUrl', 'colorTheme', 'coverImageUrl', 'coverImageStyle', 'fontFamily', 'googleFontUrl', 'menuTheme'],
  },
]

export default function SettingsTabs({
  activeTab,
  errors,
  onSelect,
}: {
  activeTab: SettingsTab
  errors: FieldErrors<EditRestaurantValues>
  onSelect: (tab: SettingsTab) => void
}) {
  return (
    <div role="tablist" aria-label="Settings sections" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
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
  )
}
