// components/staff/device-setup/device-row.tsx
// One line of the device sheet: what the capability is, where this device stands with it in
// plain words, and the one control that changes or tests it. The state is words and not only a
// colour, because the colour is lost on a greasy screen at arm's length and to anyone who does
// not see it.
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** How a state reads: done, needing something from the person, or plain information. */
export type RowTone = 'ok' | 'attention' | 'plain'

interface DeviceRowProps {
  icon: LucideIcon
  title: string
  status: string
  tone?: RowTone | undefined
  /** Steps or an explanation under the status. */
  note?: React.ReactNode
  /** The row's control: at least 48px, one or two buttons. */
  children?: React.ReactNode
}

const TONE: Record<RowTone, string> = {
  ok: 'text-success',
  attention: 'text-warning',
  plain: 'text-muted-foreground',
}

/** A capability, its state in words, and the control that grants or tests it. */
export function DeviceRow({ icon: Icon, title, status, tone = 'plain', note, children }: DeviceRowProps) {
  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className={cn('text-sm font-medium', TONE[tone])}>{status}</p>
          {note && <div className="pt-1 text-sm text-muted-foreground">{note}</div>}
        </div>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2 pl-8 sm:pl-0">{children}</div>}
    </li>
  )
}
