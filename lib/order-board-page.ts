// lib/order-board-page.ts
// What a staff app's page needs from outside the component tree: the metadata that makes it
// installable on the device it is used from. The manifest is a route of its own
// (app/orders/manifest); this only points at it for the right restaurant and app.
import type { Metadata } from 'next'

/** Which staff app a page is; the manifest route names and scopes each one. */
export type StaffApp = 'admin' | 'manager' | 'kitchen' | 'waiter'

/** A staff page's metadata: its title, and the manifest that lets the device install it. */
export function staffAppMetadata(id: string, app: StaffApp, title: string): Metadata {
  return { title, manifest: `/orders/manifest?id=${id}&portal=${app}` }
}

/** The board's page metadata: its title, and the manifest that lets a tablet install it. */
export function boardMetadata(id: string, portal: 'admin' | 'manager' | 'kitchen'): Metadata {
  return staffAppMetadata(id, portal, 'Orders')
}
