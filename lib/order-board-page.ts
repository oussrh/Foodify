// lib/order-board-page.ts
// What both portals' board pages need from outside the component tree: the metadata that makes
// the board installable on a tablet. The manifest is a route of its own (app/orders/manifest);
// this only points at it for the right restaurant and portal.
import type { Metadata } from 'next'

/** The board's page metadata: its title, and the manifest that lets a tablet install it. */
export function boardMetadata(id: string, portal: 'admin' | 'manager' | 'kitchen'): Metadata {
  return { title: 'Orders', manifest: `/orders/manifest?id=${id}&portal=${portal}` }
}
