"use client"

import { useState, useMemo, useCallback } from 'react'
import MenuSearchFilter, { type FilterOptions } from './menu-search-filter'
import ImprovedDishCard from './improved-dish-card'
import ARQuickAccessFAB from './ar-quick-access-fab'
import ScrollToTopButton from './scroll-to-top-button'
import { Camera, Search } from 'lucide-react'

interface Dish {
  id: string
  nameEn: string
  nameFr: string
  descriptionEn: string | null
  descriptionFr: string | null
  imageUrl: string
  price: number
  calories: number | null
  usdzUrl: string | null
  glbUrl: string | null
  isMostPurchased: boolean
}

interface SubCategory {
  id: string
  nameEn: string
  nameFr: string
  dishes: Dish[]
}

interface Category {
  id: string
  nameEn: string
  nameFr: string
  subcategories: SubCategory[]
}

interface RestaurantMenuClientProps {
  categories: Category[]
  uncategorizedDishes: Dish[]
  locale: string
  restaurantSlug: string
  currency: string
  fontFamily?: string
  primaryColor: string
  secondaryColor: string
}

export default function RestaurantMenuClient({
  categories,
  uncategorizedDishes,
  locale,
  restaurantSlug,
  currency,
  fontFamily,
  primaryColor,
  secondaryColor
}: RestaurantMenuClientProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    vegetarian: false,
    vegan: false,
    spicy: false,
    glutenFree: false,
    popular: false,
  })

  // Helper function to check dietary preferences
  const checkDietaryPreference = (dish: Dish, preference: 'vegetarian' | 'vegan' | 'spicy' | 'glutenFree') => {
    const name = (dish.nameEn || '').toLowerCase()
    const desc = (dish.descriptionEn || '').toLowerCase()

    switch (preference) {
      case 'vegetarian':
        return name.includes('veggie') || name.includes('salad') || name.includes('vegetarian') || desc.includes('vegetarian')
      case 'vegan':
        return name.includes('vegan') || desc.includes('vegan')
      case 'spicy':
        return name.includes('spicy') || desc.includes('spicy') || desc.includes('hot')
      case 'glutenFree':
        return name.includes('gluten-free') || desc.includes('gluten-free') || name.includes('gf')
      default:
        return false
    }
  }

  // Filter dishes based on active filters
  const filterDish = useCallback((dish: Dish): boolean => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = (dish.nameEn?.toLowerCase() || '').includes(searchLower) ||
                       (dish.nameFr?.toLowerCase() || '').includes(searchLower)
      const descMatch = (dish.descriptionEn?.toLowerCase() || '').includes(searchLower) ||
                       (dish.descriptionFr?.toLowerCase() || '').includes(searchLower)
      if (!nameMatch && !descMatch) return false
    }

    // Dietary filters
    if (filters.vegetarian && !checkDietaryPreference(dish, 'vegetarian')) return false
    if (filters.vegan && !checkDietaryPreference(dish, 'vegan')) return false
    if (filters.spicy && !checkDietaryPreference(dish, 'spicy')) return false
    if (filters.glutenFree && !checkDietaryPreference(dish, 'glutenFree')) return false

    // Popular filter
    if (filters.popular && !dish.isMostPurchased) return false

    return true
  }, [filters])

  // Filter all categories and dishes
  const filteredData = useMemo(() => {
    const filtered = categories.map(category => ({
      ...category,
      subcategories: category.subcategories.map(subcategory => ({
        ...subcategory,
        dishes: subcategory.dishes.filter(filterDish)
      })).filter(sub => sub.dishes.length > 0)
    })).filter(cat => cat.subcategories.length > 0)

    const filteredUncategorized = uncategorizedDishes.filter(filterDish)

    return { categories: filtered, uncategorizedDishes: filteredUncategorized }
  }, [filterDish, categories, uncategorizedDishes])

  // Count AR dishes
  const arDishCount = useMemo(() => {
    let count = 0
    categories.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.dishes.forEach(dish => {
          if (dish.usdzUrl || dish.glbUrl) count++
        })
      })
    })
    uncategorizedDishes.forEach(dish => {
      if (dish.usdzUrl || dish.glbUrl) count++
    })
    return count
  }, [categories, uncategorizedDishes])

  const hasResults = filteredData.categories.length > 0 || filteredData.uncategorizedDishes.length > 0

  return (
    <>
      {/* Search and Filter Bar */}
      <MenuSearchFilter
        onFilterChange={setFilters}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12 lg:py-16" style={{ fontFamily: fontFamily || 'inherit' }}>
        {!hasResults ? (
          // No Results Message
          <div className="text-center py-16 space-y-6">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Search className="h-10 w-10" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: fontFamily || 'inherit' }}>
                No dishes found
              </h3>
              <p className="text-gray-600 dark:text-gray-400" style={{ fontFamily: fontFamily || 'inherit' }}>
                Try adjusting your search or filters to find what you&apos;re looking for
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-14 md:space-y-16 lg:space-y-20">
            {/* Filtered Categories */}
            {filteredData.categories.map((category, categoryIndex) => (
              <section
                key={category.id}
                className="space-y-10 sm:space-y-12 animate-in fade-in duration-500"
                style={{ animationDelay: `${categoryIndex * 0.05}s` }}
              >
                <div className="text-center space-y-6">
                  <div className="inline-block">
                    <h2
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight"
                      style={{ fontFamily: fontFamily || 'inherit' }}
                    >
                      {locale === 'fr' ? category.nameFr : category.nameEn}
                    </h2>
                    <div
                      className="w-20 sm:w-28 md:w-32 h-1.5 mx-auto rounded-full mt-3 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>

                {/* Subcategories */}
                {category.subcategories.map((subcategory, subIndex) => (
                  <div
                    key={subcategory.id}
                    className="space-y-8 animate-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${(categoryIndex * 0.05) + (subIndex * 0.03)}s` }}
                  >
                    <div className="flex items-center justify-center px-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                      <h3
                        className="px-6 sm:px-8 text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent whitespace-nowrap"
                        style={{ fontFamily: fontFamily || 'inherit' }}
                      >
                        {locale === 'fr' ? subcategory.nameFr : subcategory.nameEn}
                      </h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                    </div>

                    <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {subcategory.dishes.map((dish) => (
                        <ImprovedDishCard
                          key={dish.id}
                          dish={{
                            ...dish,
                            isVegetarian: checkDietaryPreference(dish, 'vegetarian'),
                            isVegan: checkDietaryPreference(dish, 'vegan'),
                            isSpicy: checkDietaryPreference(dish, 'spicy'),
                            isGlutenFree: checkDietaryPreference(dish, 'glutenFree'),
                          }}
                          locale={locale}
                          restaurantSlug={restaurantSlug}
                          currency={currency}
                          fontFamily={fontFamily}
                          primaryColor={primaryColor}
                          secondaryColor={secondaryColor}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}

            {/* Uncategorized Dishes */}
            {filteredData.uncategorizedDishes.length > 0 && (
              <section
                className="space-y-10 sm:space-y-12 animate-in fade-in duration-500"
                style={{ animationDelay: `${filteredData.categories.length * 0.05}s` }}
              >
                <div className="text-center space-y-6">
                  <div className="inline-block">
                    <h2
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight"
                      style={{ fontFamily: fontFamily || 'inherit' }}
                    >
                      Special Dishes
                    </h2>
                    <div
                      className="w-20 sm:w-28 md:w-32 h-1.5 mx-auto rounded-full mt-3 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredData.uncategorizedDishes.map((dish) => (
                    <ImprovedDishCard
                      key={dish.id}
                      dish={{
                        ...dish,
                        isVegetarian: checkDietaryPreference(dish, 'vegetarian'),
                        isVegan: checkDietaryPreference(dish, 'vegan'),
                        isSpicy: checkDietaryPreference(dish, 'spicy'),
                        isGlutenFree: checkDietaryPreference(dish, 'glutenFree'),
                      }}
                      locale={locale}
                      restaurantSlug={restaurantSlug}
                      currency={currency}
                      fontFamily={fontFamily}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Floating AR Button */}
      <ARQuickAccessFAB
        arDishCount={arDishCount}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Scroll to Top Button */}
      <ScrollToTopButton
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </>
  )
}
