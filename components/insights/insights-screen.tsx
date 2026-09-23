// components/insights/insights-screen.tsx
// The Insights tab as both portals show it. Figures first, each with how it moved against the
// window before; then the same story as charts — over time, dish by dish, hour by hour. The
// bucket-by-bucket table is kept under the charts, folded: it is the charts' text alternative
// and the place to read an exact figure. A restaurant that takes no orders sees the menu's half.
import { GRAIN_BUCKETS, GRAIN_WINDOW, totalsOf, type Grain, type InsightsBucket } from '@/lib/insights'
import type { DishStat } from '@/lib/insights-dishes'
import type { RhythmGrid } from '@/lib/insights-rhythm'
import { audienceScores, kitchenScores, salesScores } from '@/lib/insights-scores'
import type { Money } from '@/lib/menu'
import { PageHeader } from '@/components/shell/page-header'
import { DishesSection } from '@/components/insights/dishes-section'
import { GrainTabs } from '@/components/insights/grain-tabs'
import { InsightsTable } from '@/components/insights/insights-table'
import { KitchenSection } from '@/components/insights/kitchen-section'
import { RhythmSection } from '@/components/insights/rhythm-section'
import { ScoreStrip } from '@/components/insights/score-strip'
import { TrendSection } from '@/components/insights/trend-section'

export interface InsightsScreenProps {
  restaurantName: string
  ordering: boolean
  grain: Grain
  buckets: InsightsBucket[]
  /** The window before, as many buckets, for the changes. */
  previous: InsightsBucket[]
  dishes: DishStat[]
  rhythm: RhythmGrid
  devices: { device: string; views: number; arViews: number }[]
  money: Money
  /** The restaurant's zone, which the days and hours are counted in. */
  timeZone: string
  /** The tab's own path, for the period links. */
  basePath: string
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

/**
 * The Insights tab both portals render: scores against the window before, then the charts, with the
 * bucket table folded underneath as their text alternative.
 */
export function InsightsScreen(props: InsightsScreenProps) {
  const { restaurantName, ordering, grain, buckets, previous, money } = props
  const now = totalsOf(buckets)
  const before = totalsOf(previous)
  const against = `vs the ${GRAIN_BUCKETS[grain]} ${grain}s before`

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Insights"
        description={`How ${restaurantName} is being read and served over ${GRAIN_WINDOW[grain]}, compared with the ${GRAIN_BUCKETS[grain]} ${grain}s before.`}
        actions={<GrainTabs basePath={props.basePath} current={grain} />}
        className="pb-0"
      />

      {ordering && (
        <Group title="Sales">
          <ScoreStrip scores={salesScores(now, before, money)} against={against} />
        </Group>
      )}
      <Group title="Menu">
        <ScoreStrip scores={audienceScores(now, before, ordering)} against={against} />
        <TrendSection buckets={buckets} grain={grain} ordering={ordering} money={money} />
      </Group>
      {ordering && (
        <Group title="Kitchen and floor">
          <ScoreStrip scores={kitchenScores(now, before)} against={against} />
          <KitchenSection buckets={buckets} grain={grain} />
        </Group>
      )}
      <Group title="Dishes">
        <DishesSection totals={now} dishes={props.dishes} ordering={ordering} money={money} />
      </Group>
      <Group title="When and where">
        <RhythmSection rhythm={props.rhythm} devices={props.devices} ordering={ordering} timeZone={props.timeZone} />
      </Group>

      {!ordering && (
        <p className="text-sm text-muted-foreground">
          This restaurant is not taking orders, so there is nothing to count between reading the menu and being served.
          Turn ordering on in Settings → General and the cart, the orders, the revenue and the kitchen&apos;s times appear here.
        </p>
      )}

      <details className="group rounded-lg border border-border bg-card">
        <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-medium">Every figure as a table</summary>
        <div className="border-t border-border">
          <InsightsTable buckets={buckets} grain={grain} ordering={ordering} money={money} />
        </div>
      </details>
    </div>
  )
}
