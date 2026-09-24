// lib/order-board-page.ts
// What a staff app's page needs from outside the component tree: the metadata that makes it
// installable on the device it is used from. The manifest is a route of its own
// (app/orders/manifest); this only points at it for the right restaurant and app.
import type { Metadata } from 'next'
import { restaurantRef, type STAFF_APPS } from '@/lib/schemas/staff-app'

/** Which staff app a page is; the manifest route names and scopes each one. */
export type StaffApp = (typeof STAFF_APPS)[number]

/**
 * A staff page's metadata: its title, and the manifest that lets the device install it. `param`
 * is the page's segment as it came (a code or a uuid, `restaurantRef`); only its parsed value is
 * written into the manifest's address, and a segment that is neither gets no manifest — the page
 * itself answers 404 for it.
 */
export function staffAppMetadata(param: string, app: StaffApp, title: string): Metadata {
  const ref = restaurantRef.safeParse(param)
  return ref.success ? { title, manifest: `/orders/manifest?id=${ref.data}&portal=${app}` } : { title }
}

/** The board's page metadata: its title, and the manifest that lets a tablet install it. */
export function boardMetadata(id: string, portal: 'admin' | 'manager' | 'kitchen'): Metadata {
  return staffAppMetadata(id, portal, 'Orders')
}
