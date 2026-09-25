'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// The app has two theme scopes, each with its own remembered choice, and one provider per route
// subtree so the two never mount together (the root layout has none: reading the path there would
// make every page dynamic).
//
// - Staff (admin, manager, kitchen, waiter, their sign-ins, the landing page): light until this
//   device chooses otherwise. A tablet on the pass or a phone in a dining room is read under
//   bright light, and a dark screen because the phone happens to be in dark mode was a surprise.
//   Its key is its own, so a choice saved under the old shared key does not carry over.
// - The guest menu: follows the device, under the key it has always used, and a restaurant's
//   forced `menuTheme` is applied on top by the menu itself (`.brand-scope`).

/** Where a staff device remembers its light / dark / follow-the-device choice. */
export const STAFF_THEME_KEY = 'foodify-theme'

/** The staff theme scope: light by default, dark or "follow the device" when chosen, remembered per device. */
export function StaffTheme({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem storageKey={STAFF_THEME_KEY}>
      {children}
    </NextThemesProvider>
  )
}

/** The guest menu's theme scope: follows the device unless the guest picks one on the menu. */
export function MenuTheme({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
