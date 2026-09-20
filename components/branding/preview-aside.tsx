'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import type { MenuTheme } from '@/lib/menu'
import { cn } from '@/lib/utils'
import MenuPreview, { type MenuPreviewValues } from './menu-preview'

interface PreviewAsideProps {
  values: MenuPreviewValues
  menuTheme: MenuTheme
}

/** The live phone preview; when the menu follows the device, a toggle shows either appearance. */
export default function PreviewAside({ values, menuTheme }: PreviewAsideProps) {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
  const shownTheme: 'light' | 'dark' = menuTheme === 'system' ? previewTheme : menuTheme

  return (
    <aside className="flex flex-col items-center gap-3 lg:order-last lg:sticky lg:top-28 lg:self-start">
      <MenuPreview theme={shownTheme} values={values} />
      {menuTheme === 'system' ? (
        <div role="group" aria-label="Preview appearance" className="flex rounded-md border border-input bg-card p-0.5">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreviewTheme(t)}
              aria-pressed={previewTheme === t}
              className={cn(
                'flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                previewTheme === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'light' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Guests always see the {menuTheme} version.</p>
      )}
      <p className="text-center text-xs text-muted-foreground">Live preview of the first screen guests see. Dishes are examples.</p>
    </aside>
  )
}
