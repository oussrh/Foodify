// lib/order-board-page.ts
// What a staff app's page needs from outside the component tree: the metadata that makes it
// installable on the device it is used from. The manifest is a route of its own
// (app/orders/manifest); this only points at it for the right restaurant and app. An iPhone or
// iPad reads none of the manifest's icons, name or colours for "Add to Home Screen" — it reads
// the apple-* tags — so those are written here as well: full screen under the default status bar
// (dark text: the staff apps are light, and a translucent bar's white text would vanish on them;
// the headers still pad by the safe area, `staff-safe-top`, for the notch), the app's one-word
// name under its own Foodizar icon, the Basil startup image for each common iPhone and iPad
// (lib/staff-apps.ts lists them), and no phone-number links made out of order and table numbers.
import type { Metadata } from 'next'
import { restaurantRef, type STAFF_APPS } from '@/lib/schemas/staff-app'
import { STAFF_APP_IDENTITY, staffBrandApp, staffIconPath, startupImages } from '@/lib/staff-apps'

/** Which staff app a page is; the manifest route names and scopes each one. */
export type StaffApp = (typeof STAFF_APPS)[number]

/**
 * A staff page's metadata: its title, what an iPhone or iPad installs it as, and the manifest that
 * lets any other device install it. `param` is the page's segment as it came (a code or a uuid,
 * `restaurantRef`); only its parsed value is written into the manifest's address, and a segment
 * that is neither gets no manifest — the page itself answers 404 for it.
 */
export function staffAppMetadata(param: string, app: StaffApp): Metadata {
  const ref = restaurantRef.safeParse(param)
  const brand = staffBrandApp(app)
  const identity = STAFF_APP_IDENTITY[brand]
  const device: Metadata = {
    title: identity.name,
    appleWebApp: {
      capable: true,
      title: identity.shortName,
      statusBarStyle: 'default',
      startupImage: startupImages(brand).map(({ url, media }) => ({ url, media })),
    },
    icons: { apple: staffIconPath(brand, 'apple-180') },
    formatDetection: { telephone: false },
  }
  return ref.success ? { ...device, manifest: `/orders/manifest?id=${ref.data}&portal=${app}` } : device
}

/** The board's page metadata: Foodizar Kitchen on the tablet's route, Foodizar Orders in a portal. */
export function boardMetadata(id: string, portal: 'admin' | 'manager' | 'kitchen'): Metadata {
  return staffAppMetadata(id, portal)
}
