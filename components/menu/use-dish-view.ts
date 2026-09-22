// components/menu/use-dish-view.ts
// Records that a guest opened a dish, once per dish for the life of the page. Opening the same
// dish twice in one visit is one guest looking twice, not two readers, and the sheet re-renders
// on every quantity change — without the seen set a stepper would count a view per tap.
'use client'

import { useEffect, useRef } from 'react'
import { trackDishView } from './track'

/** Beacons a view for `dishId` when it first becomes non-null; null (the sheet closed) records nothing. */
export function useDishView(dishId: string | null) {
  const seen = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!dishId || seen.current.has(dishId)) return
    seen.current.add(dishId)
    trackDishView(dishId)
  }, [dishId])
}
