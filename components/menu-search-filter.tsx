"use client"

import { useState } from 'react'
import { Search, Filter, X, Leaf, Flame, Wheat, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

export interface FilterOptions {
  search: string
  vegetarian: boolean
  vegan: boolean
  spicy: boolean
  glutenFree: boolean
  popular: boolean
}

interface MenuSearchFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  primaryColor?: string
  secondaryColor?: string
}

export default function MenuSearchFilter({
  onFilterChange,
  primaryColor = '#6366f1',
  secondaryColor = '#8b5cf6'
}: MenuSearchFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    vegetarian: false,
    vegan: false,
    spicy: false,
    glutenFree: false,
    popular: false,
  })

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const updateFilter = (key: keyof FilterOptions, value: boolean | string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      search: '',
      vegetarian: false,
      vegan: false,
      spicy: false,
      glutenFree: false,
      popular: false,
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'search' && value === true
  ).length

  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search dishes..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 pr-10 h-11 rounded-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 focus:border-2 focus:ring-0 focus:ring-offset-0 text-base transition-colors duration-200"
              style={{
                borderColor: filters.search ? primaryColor : undefined
              }}
            />
            {filters.search && (
              <button
                onClick={() => updateFilter('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-4 rounded-full border-2 relative"
                style={{
                  borderColor: activeFilterCount > 0 ? primaryColor : undefined,
                  color: activeFilterCount > 0 ? primaryColor : undefined
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white'
                    }}
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Filter Menu</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Refine your dish selection based on your preferences
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {/* Quick Filters */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Dietary Preferences</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <FilterChip
                      icon={<Leaf className="h-4 w-4" />}
                      label="Vegetarian"
                      active={filters.vegetarian}
                      onClick={() => updateFilter('vegetarian', !filters.vegetarian)}
                      primaryColor={primaryColor}
                    />
                    <FilterChip
                      icon={<Leaf className="h-4 w-4" />}
                      label="Vegan"
                      active={filters.vegan}
                      onClick={() => updateFilter('vegan', !filters.vegan)}
                      primaryColor={primaryColor}
                    />
                    <FilterChip
                      icon={<Flame className="h-4 w-4" />}
                      label="Spicy"
                      active={filters.spicy}
                      onClick={() => updateFilter('spicy', !filters.spicy)}
                      primaryColor={primaryColor}
                    />
                    <FilterChip
                      icon={<Wheat className="h-4 w-4" />}
                      label="Gluten-Free"
                      active={filters.glutenFree}
                      onClick={() => updateFilter('glutenFree', !filters.glutenFree)}
                      primaryColor={primaryColor}
                    />
                  </div>
                </div>

                {/* Special Filters */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Special</h3>

                  <FilterChip
                    icon={<Star className="h-4 w-4" />}
                    label="Popular Dishes"
                    active={filters.popular}
                    onClick={() => updateFilter('popular', !filters.popular)}
                    primaryColor={primaryColor}
                    fullWidth
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex-1 h-12 rounded-full"
                    disabled={activeFilterCount === 0}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1 h-12 rounded-full text-white"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  >
                    Show Results
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active:</span>
            {filters.vegetarian && (
              <ActiveFilterBadge
                label="Vegetarian"
                onRemove={() => updateFilter('vegetarian', false)}
                primaryColor={primaryColor}
              />
            )}
            {filters.vegan && (
              <ActiveFilterBadge
                label="Vegan"
                onRemove={() => updateFilter('vegan', false)}
                primaryColor={primaryColor}
              />
            )}
            {filters.spicy && (
              <ActiveFilterBadge
                label="Spicy"
                onRemove={() => updateFilter('spicy', false)}
                primaryColor={primaryColor}
              />
            )}
            {filters.glutenFree && (
              <ActiveFilterBadge
                label="Gluten-Free"
                onRemove={() => updateFilter('glutenFree', false)}
                primaryColor={primaryColor}
              />
            )}
            {filters.popular && (
              <ActiveFilterBadge
                label="Popular"
                onRemove={() => updateFilter('popular', false)}
                primaryColor={primaryColor}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  icon,
  label,
  active,
  onClick,
  primaryColor,
  fullWidth = false
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  primaryColor: string
  fullWidth?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`${fullWidth ? 'col-span-2' : ''} flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all duration-200 font-medium text-sm touch-manipulation active:scale-95 dark:bg-gray-800 ${
        active
          ? 'border-current shadow-lg'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      }`}
      style={{
        backgroundColor: active ? `${primaryColor}15` : undefined,
        borderColor: active ? primaryColor : undefined,
        color: active ? primaryColor : undefined,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function ActiveFilterBadge({
  label,
  onRemove,
  primaryColor
}: {
  label: string
  onRemove: () => void
  primaryColor: string
}) {
  return (
    <Badge
      className="pl-3 pr-2 py-1.5 gap-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: `${primaryColor}15`,
        color: primaryColor,
        borderColor: `${primaryColor}30`,
      }}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}
