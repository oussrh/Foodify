// components/menu/tracking/order-steps.tsx
// The guest's order as four steps down the page (sent, being prepared, on its way, served), each
// ticked once reached with the time it was, the current one in bold. The times are the phone's
// clock: the guest is sitting in the restaurant, so it is the restaurant's too.
'use client'

import { Check } from 'lucide-react'
import { type StepView } from '@/lib/guest-status'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { cn } from '@/lib/utils'

/** "19:04" (or "7:04 PM") in the guest's language. */
const clock = (iso: string, locale: Locale) => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

/** One step: its tick, the line down to the next one, its words and when it was reached. */
function Step({ view, next, locale }: { view: StepView; next: StepView | undefined; locale: Locale }) {
  const t = MENU_TEXT[locale]
  return (
    <li className="flex gap-3" aria-current={view.current ? 'step' : undefined}>
      <div className="flex flex-col items-center" aria-hidden="true">
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', view.reached ? 'border-brand bg-brand text-brand-on' : 'border-border-strong bg-background')}>
          {view.reached && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
        {next && <span className={cn('min-h-6 w-0.5 flex-1', next.reached ? 'bg-brand' : 'bg-border')} />}
      </div>
      <div className={cn('min-w-0', next && 'pb-5')}>
        <p className={cn('text-[15px] leading-6', view.current ? 'font-semibold' : !view.reached && 'text-muted-foreground')}>{t.orderStatus[view.step]}</p>
        {view.at && (
          <time dateTime={view.at} className="tnum block text-xs text-muted-foreground">
            {clock(view.at, locale)}
          </time>
        )}
      </div>
    </li>
  )
}

/** The order's progress as an ordered list, the current step marked for assistive tech (`aria-current="step"`). */
export default function OrderSteps({ steps, locale }: { steps: StepView[]; locale: Locale }) {
  return (
    <ol aria-label={MENU_TEXT[locale].orderProgress}>
      {steps.map((view, i) => (
        <Step key={view.step} view={view} next={steps[i + 1]} locale={locale} />
      ))}
    </ol>
  )
}
