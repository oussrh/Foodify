// components/restaurant-form/settings-screen.tsx
// The Settings page as both portals show it: the header, the form with its tabs, and the
// Integrations tab's POS panel. The pages differ in how they reach the restaurant and what
// follows the form (the admin's delete).
import type { Restaurant } from '@/generated/prisma/client'
import EditRestaurantForm from '@/components/edit-restaurant-form'
import { restaurantFormValues } from '@/components/forms/form-defaults'
import { PosPanel } from '@/components/pos/pos-panel'
import { PageHeader } from '@/components/shell/page-header'
import type { PosView } from '@/lib/pos/view'

interface SettingsScreenProps {
  restaurant: Restaurant
  pos: PosView
  children?: React.ReactNode
}

/** The Settings page: header, the settings form, the POS panel on its own tab, then `children`. */
export function SettingsScreen({ restaurant, pos, children }: SettingsScreenProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      <PageHeader title="Settings" description="Name, address, hours, branding and currency. Changes go live on the public menu as soon as you save." />
      <EditRestaurantForm id={restaurant.id} defaultValues={restaurantFormValues(restaurant)} integrations={<PosPanel view={pos} />} />
      {children}
    </div>
  )
}
