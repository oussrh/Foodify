"use client"

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LanguageSwitcherProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
  primaryColor?: string
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]

export default function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  primaryColor = '#6366f1'
}: LanguageSwitcherProps) {
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white hover:bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px] dark:bg-gray-900 dark:border-gray-700">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => onLocaleChange(language.code)}
            className={`cursor-pointer flex items-center gap-3 px-4 py-2.5 ${
              currentLocale === language.code
                ? 'font-semibold'
                : ''
            }`}
            style={{
              backgroundColor: currentLocale === language.code ? `${primaryColor}15` : undefined,
              color: currentLocale === language.code ? primaryColor : undefined,
            }}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
