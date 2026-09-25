// components/pos/pos-panel.tsx
// Settings → Integrations, as both portals show it: the screen the connection is at (the provider
// list, the location, the matching, the health panel), under a notice when this server cannot
// seal credentials. The page reads the view (server/pos/view.ts)
// and every action refreshes it, so the screen always follows the connection as stored.
import { POS_NOT_CONFIGURED } from '@/lib/pos/status'
import type { PosView } from '@/lib/pos/view'
import { HealthPanel } from './health-panel'
import { LocationPick } from './location-pick'
import { MappingCard } from './mapping-card'
import { ProviderList } from './provider-list'

/** A plain notice in the panel. */
function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-border bg-card px-5 py-4 text-sm">{children}</p>
}

/** The screen for where the connection stands. */
function PosScreen({ view }: { view: PosView }) {
  const { connection, restaurantId } = view
  if (!connection) return <ProviderList restaurantId={restaurantId} providers={view.providers} />
  if (connection.status === 'CONNECTING') return <LocationPick restaurantId={restaurantId} connection={connection} />
  if (connection.status === 'MAPPING') return <MappingCard restaurantId={restaurantId} activate />
  return <HealthPanel restaurantId={restaurantId} connection={connection} />
}

/** The Integrations tab's POS section. */
export function PosPanel({ view }: { view: PosView }) {
  return (
    <section aria-labelledby="pos-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="pos-heading" className="text-lg font-semibold">
          Point of sale
        </h2>
        <p className="text-sm text-muted-foreground">Send every order to your till as it is placed, and hear back when a bill is paid.</p>
      </div>
      {!view.configured && <Notice>{POS_NOT_CONFIGURED}. Ask support to set it up.</Notice>}
      <PosScreen view={view} />
    </section>
  )
}
