// components/pos/provider-list.tsx
// The first screen: every POS Foodify knows, the ones not ready yet marked Coming soon with a line
// on each, and a Connect button on the ones that are. Connect opens the sign-in form in place.
'use client'

import { useState } from 'react'
import type { ProviderSummary } from '@/lib/pos/registry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectForm } from './connect-form'

/** The providers, and the sign-in form for the one chosen. */
export function ProviderList({ restaurantId, providers }: { restaurantId: string; providers: ProviderSummary[] }) {
  const [chosen, setChosen] = useState<ProviderSummary | null>(null)
  if (chosen) return <ConnectForm restaurantId={restaurantId} provider={chosen} onCancel={() => setChosen(null)} />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect your POS</CardTitle>
        <CardDescription>Orders from the menu and the waiters’ phones go straight to your till: tickets, changes and closed bills.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border border-t border-border">
          {providers.map((provider) => (
            <li key={provider.key} className="flex min-h-16 flex-wrap items-center gap-3 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{provider.name}</span>
                <span className="block text-sm text-muted-foreground">{provider.note}</span>
              </span>
              {provider.status === 'available' ? (
                <Button className="h-12" onClick={() => setChosen(provider)} aria-label={`Connect ${provider.name}`}>
                  Connect
                </Button>
              ) : (
                <Badge variant="outline">Coming soon</Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
