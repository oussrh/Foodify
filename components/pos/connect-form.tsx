// components/pos/connect-form.tsx
// Signing in to the chosen POS with an API key. The key is checked by the POS before anything is
// kept; it is sealed on the server and never shown again. The rule under the field is the one the
// action parses with.
'use client'

import { useId, useState } from 'react'
import { connectPos } from '@/app/actions/pos-connect-actions'
import type { ProviderSummary } from '@/lib/pos/registry'
import { posConnectInput } from '@/lib/schemas/pos'
import { firstIssue } from '@/lib/schemas/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePosAction } from './use-pos-action'

/** The API key form for `provider`; `onCancel` goes back to the list. */
export function ConnectForm({ restaurantId, provider, onCancel }: { restaurantId: string; provider: ProviderSummary; onCancel: () => void }) {
  const fieldId = useId()
  const [apiKey, setApiKey] = useState('')
  const [issue, setIssue] = useState('')
  const { busy, run } = usePosAction()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = posConnectInput.safeParse({ provider: provider.key, apiKey })
    setIssue(parsed.success ? '' : firstIssue(parsed.error))
    if (!parsed.success) return
    await run(() => connectPos(restaurantId, parsed.data), `Signed in to ${provider.name}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect {provider.name}</CardTitle>
        <CardDescription>Paste the API key from your POS. It is checked with the POS, then stored encrypted and never shown again.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId}>API key</Label>
            <Input
              id={fieldId}
              className="h-12"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              aria-invalid={issue ? true : undefined}
              aria-describedby={`${fieldId}-help`}
            />
            <p id={`${fieldId}-help`} className={issue ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
              {issue || (provider.key === 'test-pos' ? 'The Test POS takes any key that starts with test_ (for example test_demo_key).' : 'Found in your POS back office, under integrations.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-12" disabled={busy}>
              {busy ? 'Connecting…' : 'Connect'}
            </Button>
            <Button type="button" variant="ghost" className="h-12" disabled={busy} onClick={onCancel}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
