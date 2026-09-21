// components/shell/dish-editor.tsx
// The dish edit page's body, the same for both portals: the header with the view count, the
// status toggles, the edit form (offering the restaurant's dietary options and its subcategories
// as "Category → Subcategory") and the ingredient manager. A page loads and guards, then hands
// its rows here; the admin page adds its delete section after.
import type { Route } from 'next'
import type { Dish, Ingredient, MenuCategory, MenuSubcategory } from '@/generated/prisma/client'
import EditDishForm from '@/components/edit-dish-form'
import { dishFormValues } from '@/components/forms/form-defaults'
import IngredientManager from '@/components/ingredient-manager'
import DishStatusManager from '@/components/dish-status-manager'
import { PageHeader } from '@/components/shell/page-header'
import type { ShellPortal } from '@/components/shell/shell-types'

export type EditableDish = Dish & { ingredients: Ingredient[]; _count: { views: number } }
export type DishRestaurant = { id: string; name: string; dietaryOptions: string[]; categories: (MenuCategory & { subcategories: MenuSubcategory[] })[] }

export default function DishEditor({ portal, restaurant, dish }: { portal: ShellPortal; restaurant: DishRestaurant; dish: EditableDish }) {
  const subcategories = restaurant.categories.flatMap((category) =>
    category.subcategories.map((sub) => ({ id: sub.id, nameEn: `${category.nameEn} → ${sub.nameEn}` })),
  )
  return (
    <>
      <PageHeader
        title={dish.nameEn}
        description={`${dish.nameFr} · ${dish._count.views} view${dish._count.views === 1 ? '' : 's'} so far`}
        back={{ href: `/${portal}/restaurants/${restaurant.id}/dishes` as Route, label: 'All dishes' }}
      />

      <DishStatusManager dishId={dish.id} isActive={dish.isActive} isMostPurchased={dish.isMostPurchased} />

      <EditDishForm
        key={`${dish.id}-${dish.imageUrl}-${dish.usdzUrl}-${dish.glbUrl}`}
        id={dish.id}
        defaultValues={dishFormValues(dish)}
        subcategories={subcategories}
        restaurantName={restaurant.name}
        dietaryOptions={restaurant.dietaryOptions}
      />

      <IngredientManager dishId={dish.id} ingredients={dish.ingredients} />
    </>
  )
}
