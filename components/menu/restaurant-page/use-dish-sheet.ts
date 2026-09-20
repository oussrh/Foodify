'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import type { MenuDish } from '@/lib/menu'

/**
 * The dish sheet: opened from a row with a shared-element morph of its thumbnail, pushed on the
 * history so the back button closes it.
 */
export function useDishSheet() {
  const [openDish, setOpenDish] = useState<MenuDish | null>(null)
  const [transitionDishId, setTransitionDishId] = useState<string | null>(null)

  useEffect(() => {
    const onPop = () => setOpenDish(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const showDish = (dish: MenuDish) => {
    const open = () => setOpenDish(dish)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition
    if (vt && !reduce) {
      // Shared-element morph: the row thumbnail grows into the sheet photo.
      flushSync(() => setTransitionDishId(dish.id))
      vt.call(document, () => flushSync(open)).finished.finally(() => setTransitionDishId(null))
    } else {
      open()
    }
    try {
      window.history.pushState({ foodifyDish: dish.id }, '')
    } catch {
      // history may be unavailable in some embedded browsers
    }
  }
  const hideDish = () => {
    if (typeof window !== 'undefined' && window.history.state?.foodifyDish) window.history.back()
    else setOpenDish(null)
  }

  // The row whose thumbnail carries the morph, until the sheet's photo takes the name over.
  const rowTransitionId = openDish === null ? transitionDishId : null

  return { openDish, rowTransitionId, showDish, hideDish }
}
