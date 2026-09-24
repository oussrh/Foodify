// components/waiter/tab-ticket.tsx
// One ticket of the table's bill on the waiter's phone: when it went in, where it stands with the
// kitchen, each dish with what came off it, and what the waiter may still do about it. While the
// kitchen has not started it, a dish comes off at once; once it is cooking, the same button asks
// the kitchen instead, and the request shows on the line until it is answered; once it has left
// the kitchen, nothing is offered, because that is a manager's void (lib/bill-rules.ts).
'use client'

import { Hourglass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { changeLabel, staffChange, type ChangeMode } from '@/lib/bill-rules'
import { formatPrice, type Money } from '@/lib/menu'
import { effectiveQuantity, STATUS_LABEL, type BoardLine, type BoardOrder } from '@/lib/orders'
import type { RequestAnswer } from '@/lib/table-tab'
import { cn } from '@/lib/utils'

/** What the waiter asked to take off: the whole ticket, or one of its lines. */
export type TicketTarget = { order: BoardOrder; line: BoardLine | null }

interface TabTicketProps {
  order: BoardOrder
  heading: string
  money: Money
  /** The kitchen's answers to this ticket's requests, newest first. */
  answers: RequestAnswer[]
  onChange: (target: TicketTarget) => void
}

/** "Kitchen accepted: remove 1 Tea", as the waiter is told. */
function answerText(answer: RequestAnswer): string {
  const what = answer.kind === 'CANCEL' ? 'cancel the order' : `remove ${answer.quantity ?? 1} ${answer.dish ?? 'dish'}`
  return `Kitchen ${answer.accepted ? 'accepted' : 'refused'}: ${what}`
}

/**
 * Where one line stands for the waiter: what is left of it, the request waiting on it, and the
 * change they may still make (null when there is none: nothing left, already asked, or the
 * ticket has left the kitchen).
 */
function lineState(
  order: BoardOrder,
  line: BoardLine,
): {
  left: number
  pending: BoardOrder['requests'][number] | undefined
  offer: ChangeMode | null
} {
  const mode = staffChange('waiter', order.status)
  const left = effectiveQuantity(line)
  const pending = order.requests.find((request) => request.lineId === line.id)
  const blocked = left === 0 || pending !== undefined || order.requests.some((request) => request.kind === 'CANCEL')
  return {
    left,
    pending,
    offer: (mode === 'direct' || mode === 'request') && !blocked ? mode : null,
  }
}

/** One line: what is left of it, what came off, and its Remove (or the request still waiting on it). */
function TicketLine({ line, order, onChange }: { line: BoardLine; order: BoardOrder; onChange: (target: TicketTarget) => void }) {
  const { left, pending, offer } = lineState(order, line)
  return (
    <li className="flex items-center gap-2 py-1.5">
      <span className={cn('tnum w-7 shrink-0 text-[15px] font-semibold', left === 0 && 'text-muted-foreground line-through')}>{left || line.quantity}×</span>
      <span className="min-w-0 flex-1 text-[15px]">
        <span className={cn('block truncate', left === 0 && 'text-muted-foreground line-through')}>{line.nameEn}</span>
        {line.removedQuantity > 0 && <span className="block text-[13px] font-semibold text-destructive">−{line.removedQuantity} removed</span>}
        {line.note && <span className="block truncate text-[13px] italic text-muted-foreground">{line.note}</span>}
        {pending && (
          <span className="flex items-center gap-1 text-[13px] font-semibold text-warning">
            <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
            Waiting for the kitchen: remove {pending.quantity ?? 1}
          </span>
        )}
      </span>
      {offer && (
        <Button variant="outline" className="h-12 shrink-0 px-3" onClick={() => onChange({ order, line })} aria-label={`${changeLabel(offer, 'remove')} ${line.nameEn}`}>
          {changeLabel(offer, 'remove')}
        </Button>
      )}
    </li>
  )
}

/**
 * One ticket of the bill: its heading and status, each line with Remove (or Ask to remove), the
 * cancel for the whole ticket, the requests still waiting and the kitchen's answers.
 */
export function TabTicket({ order, heading, money, answers, onChange }: TabTicketProps) {
  const cancelled = order.status === 'CANCELLED'
  const mode = staffChange('waiter', order.status)
  const cancelAsked = order.requests.some((request) => request.kind === 'CANCEL')
  return (
    <li className={cn('rounded-lg border bg-card p-3', order.requests.length > 0 ? 'border-warning' : 'border-border')}>
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold">{heading}</span>
        <span className="flex-1" />
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{STATUS_LABEL[order.status]}</span>
      </div>
      <ul className={cn('pt-1', cancelled && 'line-through opacity-60')}>
        {order.lines.map((line) => (
          <TicketLine key={line.id} line={line} order={order} onChange={onChange} />
        ))}
      </ul>
      {order.note && <p className="pt-1 text-[13px] italic text-muted-foreground">“{order.note}”</p>}
      {cancelAsked && !cancelled && (
        <p className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-warning">
          <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
          Waiting for the kitchen to cancel this order
        </p>
      )}
      {answers.map((answer) => (
        <p key={answer.id} role="status" className={cn('mt-1 text-[13px] font-semibold', answer.accepted ? 'text-success' : 'text-destructive')}>
          {answerText(answer)}
        </p>
      ))}
      <div className="mt-2 flex items-center gap-2">
        {(mode === 'direct' || mode === 'request') && !cancelAsked && (
          <Button
            variant="ghost"
            className="h-12 px-3 text-[15px] text-destructive"
            onClick={() => onChange({ order, line: null })}
            aria-label={`${changeLabel(mode, 'cancel')} #${order.number}`}
          >
            {changeLabel(mode, 'cancel')}
          </Button>
        )}
        <span className="flex-1" />
        <span className={cn('tnum text-[13px] text-muted-foreground', cancelled && 'line-through')}>{formatPrice(order.subtotal, money)}</span>
      </div>
    </li>
  )
}
