// components/orders/request-banner.tsx
// The floor asking the pass to take something off a ticket already being made: "Table 4 asks to
// remove 1 Tea". It sits on the card itself, above the card's own move, in the warning colour,
// with Accept and Refuse at thumb size, because a cook who has not read it is about to plate what
// the guest no longer wants. The same banner opens the ticket's details.
'use client'

import { AlertTriangle } from 'lucide-react'
import { REASON_LABEL, type ChangeReason } from '@/lib/bill-rules'
import type { BoardOrder, PendingRequest } from '@/lib/orders'

interface RequestBannerProps {
  order: BoardOrder
  /** Answers one request: accept applies it, refuse leaves the ticket as it is. */
  onDecide: (request: PendingRequest, accept: boolean) => void
  busy: boolean
}

/** What a request asks, in the card's words: "remove 1 Tea" or "cancel this order". */
export function requestSentence(order: Pick<BoardOrder, 'lines'>, request: PendingRequest): string {
  if (request.kind === 'CANCEL') return 'cancel this order'
  const line = order.lines.find((candidate) => candidate.id === request.lineId)
  return `remove ${request.quantity ?? 1} ${line?.nameEn ?? 'dish'}`
}

/** The reason's label, and the note after it when "Other" was picked. */
function why(request: PendingRequest): string | null {
  if (!request.reason) return null
  const label = REASON_LABEL[request.reason as ChangeReason] ?? request.reason
  return request.note ? `${label}: ${request.note}` : label
}

/** Every request waiting on this ticket while it is being made, each with Accept and Refuse; nothing otherwise. */
export function RequestBanner({ order, onDecide, busy }: RequestBannerProps) {
  // A request is about food being made: once the ticket is made, served or cancelled the server
  // has answered it, and nothing is offered here for a poll that has not caught up yet.
  if (order.requests.length === 0 || order.status !== 'ACCEPTED') return null
  return (
    <div className="flex flex-col gap-2 border-t-2 border-warning bg-warning/10 p-3" role="group" aria-label={`Requests for table ${order.table}`}>
      {order.requests.map((request) => (
        <div key={request.id}>
          <p className="flex items-start gap-2 text-[15px] font-semibold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span>
              Table {order.table} asks to {requestSentence(order, request)}
              {why(request) && <span className="block text-[13px] font-normal">{why(request)}</span>}
            </span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => onDecide(request, true)} aria-label={`Accept: ${requestSentence(order, request)}`} className="h-12 rounded-md bg-foreground text-[15px] font-semibold text-background disabled:opacity-60">
              Accept
            </button>
            <button type="button" disabled={busy} onClick={() => onDecide(request, false)} aria-label={`Refuse: ${requestSentence(order, request)}`} className="h-12 rounded-md border border-border-strong bg-card text-[15px] font-semibold disabled:opacity-60">
              Refuse
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
