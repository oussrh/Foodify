// components/restaurant-form/edit-restaurant-schema.ts
// The settings form's rules: the restaurant patch (lib/schemas/restaurant) with the identity
// fields always present, and the two selects allowed to hold "" until the submit drops it.
import { z } from 'zod'
import { restaurantPatch } from '@/lib/schemas/restaurant'

// The settings form always carries the identity fields; two selects may hold "" until the submit drops it.
export const editRestaurantSchema = restaurantPatch.required({ name: true, slug: true, defaultLocale: true }).extend({
  priceRange: restaurantPatch.shape.priceRange.or(z.literal('')),
  coverImageStyle: restaurantPatch.shape.coverImageStyle.or(z.literal('')),
})

export type EditRestaurantValues = z.infer<typeof editRestaurantSchema>
