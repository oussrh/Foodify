// components/menu/track.ts
// The two things the guest menu tells the server about, so the insights report can follow a
// menu from read to order: a dish opened, and a dish put in an order. Both are fire and forget
// — a guest's menu must never wait on, or be broken by, a count — and both are silent on
// failure for the same reason. `keepalive` so a beacon sent as the page is left still goes.
'use client'

import { isAndroid, isIOS } from '@/lib/device'

function beacon(url: string, body: unknown) {
  if (typeof window === 'undefined') return
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // a count is not worth a broken menu
  })
}

/** The device as the view table names them; read here rather than passed, so a caller cannot get it wrong. */
function deviceType(): 'iOS' | 'Android' | 'Other' {
  if (isIOS()) return 'iOS'
  if (isAndroid()) return 'Android'
  return 'Other'
}

/** A guest opened a dish: the sheet on the menu, or the dish's own page. Never an AR launch — that button records its own. */
export function trackDishView(dishId: string) {
  beacon('/api/dish-views', { dishId, arViewed: false, deviceType: deviceType() })
}

/** A guest put a dish in their order. The server reads the restaurant off the dish and ignores it when ordering is off. */
export function trackCartAdd(dishId: string) {
  beacon('/api/cart-adds', { dishId })
}
