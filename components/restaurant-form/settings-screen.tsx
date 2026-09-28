// components/restaurant-form/settings-screen.tsx
// The Settings page as both portals show it: the header, the form with its tabs, and the
// Integrations tab's POS and kitchen-printer panels. The pages differ in how they reach the restaurant and what
// follows the form (the admin's delete).
import type { Restaurant } from '@/generated/prisma/client'
import EditRestaurantForm from '@/components/edit-restaurant-form'
import { restaurantFormValues } from '@/components/forms/form-defaults'
import { PosPanel } from '@/components/pos/pos-panel'
import { PrintersPanel } from '@/components/print/printers-panel'
import { PageHeader } from '@/components/shell/page-header'
import type { PosView } from '@/lib/pos/view'
import type { PrintView } from '@/lib/print/view'

/** The Integrations tab: the point of sale, then the kitchen printers. */
function Integrations({ pos, print }: { pos: PosView; print: PrintView }) {
  return (
    <div className="flex flex-col gap-10">
      <PosPanel view={pos} />
      <PrintersPanel view={print} />
    </div>
  )
}

interface SettingsScreenProps {
  restaurant: Restaurant
  pos: PosView
  print: PrintView
  children?: React.ReactNode
}

/** The Settings page: header, the settings form, the POS and printer panels on their own tab, then `children`. */
export function SettingsScreen({ restaurant, pos, print, children }: SettingsScreenProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      <PageHeader title="Settings" description="Name, address, hours, branding and currency. Changes go live on the public menu as soon as you save." />
      <EditRestaurantForm id={restaurant.id} code={restaurant.code} defaultValues={restaurantFormValues(restaurant)} integrations={<Integrations pos={pos} print={print} />} />
      {children}
    </div>
  )
}
