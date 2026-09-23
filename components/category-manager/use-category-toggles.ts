// components/category-manager/use-category-toggles.ts
// Switching a category or a subcategory on or off, for both portals' menu editors: saved first,
// then shown, and said in a toast when the save fails. The super admin's copy once flipped the
// screen and saved nothing, and the manager's logged a failure to the console only; one hook
// for both keeps them from drifting apart again.
'use client'

import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { toggleCategoryStatus, toggleSubcategoryStatus } from '@/app/actions/menu-actions'
import type { Category } from '@/components/category-manager/types'

/** The two switches' handlers over a category list held by the caller. */
export function useCategoryToggles(setCategories: Dispatch<SetStateAction<Category[]>>) {
  const toggleCategory = async (id: string) => {
    try {
      await toggleCategoryStatus(id)
    } catch {
      toast.error('Could not change that category. Try again.')
      return
    }
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, isActive: !cat.isActive } : cat)))
  }

  const toggleSub = async (catId: string, subId: string) => {
    try {
      await toggleSubcategoryStatus(subId)
    } catch {
      toast.error('Could not change that subcategory. Try again.')
      return
    }
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? { ...cat, subcategories: cat.subcategories.map((sub) => (sub.id === subId ? { ...sub, isActive: !sub.isActive } : sub)) }
          : cat,
      ),
    )
  }

  return { toggleCategory, toggleSub }
}
