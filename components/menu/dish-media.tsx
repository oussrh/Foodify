'use client'

// The dish sheet/page media area: the photo, or the dish's GLB model turned only left and right
// (a guest opens it with the Photo / 3D toggle, shown only when the dish has a GLB). The 3D view
// and its script load on demand, the first time the guest opens it.
import { useState } from 'react'
import { Box, Camera, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MENU_TEXT, type Locale, type MenuDish } from '@/lib/menu'
import DishPhoto from './dish-photo'
import Dish3D from './dish-3d'

export default function DishMedia({ dish, name, ar, locale, photoTransition }: { dish: MenuDish; name: string; ar: boolean; locale: Locale; photoTransition?: boolean | undefined }) {
  const t = MENU_TEXT[locale]
  const [mode, setMode] = useState<'photo' | '3d'>('photo')
  const has3d = Boolean(dish.glbUrl)

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted" style={photoTransition && mode === 'photo' ? { viewTransitionName: 'dish-photo' } : undefined}>
      {mode === '3d' && dish.glbUrl ? (
        <Dish3D glbUrl={dish.glbUrl} name={name} />
      ) : (
        <DishPhoto src={dish.imageUrl} alt={name} sizes="(max-width: 640px) 100vw, 640px" priority iconClassName="h-12 w-12" />
      )}

      {ar && mode === 'photo' && (
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-[#1B1A17]">
          <Camera className="h-3 w-3" aria-hidden="true" />
          {t.ar}
        </span>
      )}

      {has3d && (
        <div role="group" aria-label={t.view3d} className="absolute right-2.5 top-2.5 flex rounded-md border border-white/40 bg-black/45 p-0.5 text-white backdrop-blur-sm">
          {(['photo', '3d'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              aria-label={m === 'photo' ? t.viewPhoto : t.view3d}
              onClick={() => setMode(m)}
              className={cn('inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[11px] font-semibold transition-colors', mode === m ? 'bg-white text-[#1B1A17]' : 'text-white/85 hover:text-white')}
            >
              {m === 'photo' ? <ImageIcon className="h-3 w-3" aria-hidden="true" /> : <Box className="h-3 w-3" aria-hidden="true" />}
              {m === 'photo' ? t.photo : t.model3d}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
