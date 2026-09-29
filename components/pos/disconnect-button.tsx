// components/pos/disconnect-button.tsx
// Disconnecting, behind a confirmation that says what goes: the stored key, the matches, and
// whatever is still waiting to be sent.
'use client'

import { disconnectPos } from '@/app/actions/pos-control-actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { usePosAction } from './use-pos-action'

/** A Disconnect button that asks first; `label` names what it undoes on this screen. */
export function DisconnectButton({ restaurantId, providerName, label = 'Disconnect' }: { restaurantId: string; providerName: string; label?: string }) {
  const { busy, run } = usePosAction()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-12 text-destructive" disabled={busy}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {providerName}?</AlertDialogTitle>
          <AlertDialogDescription>
            The stored key, your dish matches and anything still waiting to be sent are removed. Orders already sent keep their POS number. You can connect again at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-12">Keep it</AlertDialogCancel>
          <AlertDialogAction className="h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void run(() => disconnectPos(restaurantId), `${providerName} disconnected`)}>
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
