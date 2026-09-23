// components/insights/insights-series.ts
// The report's buckets turned into what each chart draws: the values, and the same values in
// words for the tooltip. Written on the server page, because the words need the restaurant's
// currency and a formatter cannot be handed to a client chart.
import { bucketLabel, formatDuration, type Grain, type InsightsBucket } from '@/lib/insights'
import { axisLabel } from '@/lib/insights-chart'
import { formatMinor } from '@/lib/insights-scores'
import type { Money } from '@/lib/menu'
import type { ChartData, ChartSeries, Slot } from '@/components/insights/charts/series'

const count = (n: number) => n.toLocaleString('en-GB')

function frame(buckets: InsightsBucket[], grain: Grain) {
  return { axis: buckets.map((b) => axisLabel(b.start, grain)), titles: buckets.map((b) => bucketLabel(b.start, grain)) }
}

function countSeries(label: string, slot: Slot, values: number[]): ChartSeries {
  return { label, slot, values, display: values.map(count) }
}

/** Dishes opened, split into those that went on to AR and those that did not; they stack to the total. */
export function trafficChart(buckets: InsightsBucket[], grain: Grain): ChartData & { totals: string[] } {
  return {
    ...frame(buckets, grain),
    series: [
      countSeries('Without AR', 1, buckets.map((b) => b.views - b.arViews)),
      countSeries('In AR', 2, buckets.map((b) => b.arViews)),
    ],
    totals: buckets.map((b) => `${count(b.views)} opened`),
  }
}

/** Orders by who placed them: the guest's phone, or a waiter at the table. */
export function ordersChart(buckets: InsightsBucket[], grain: Grain): ChartData & { totals: string[] } {
  return {
    ...frame(buckets, grain),
    series: [
      countSeries('By guests', 1, buckets.map((b) => b.guestOrders)),
      countSeries('By waiters', 2, buckets.map((b) => b.staffOrders)),
    ],
    totals: buckets.map((b) => `${count(b.guestOrders + b.staffOrders)} orders`),
  }
}

/** What the orders came to, drawn in whole currency units so the axis reads 0 / 50 / 100. */
export function revenueChart(buckets: InsightsBucket[], grain: Grain, money: Money): ChartData {
  return {
    ...frame(buckets, grain),
    series: [
      {
        label: 'Revenue',
        slot: 1,
        values: buckets.map((b) => b.revenueMinor / 100),
        display: buckets.map((b) => formatMinor(b.revenueMinor, money)),
      },
    ],
  }
}

function minutesSeries(label: string, slot: Slot, seconds: (number | null)[]): ChartSeries {
  return {
    label,
    slot,
    values: seconds.map((s) => (s === null ? null : Math.round((s / 60) * 10) / 10)),
    display: seconds.map(formatDuration),
  }
}

/** The three waits of an order, in minutes: to be accepted, to be prepared, to reach the table. */
export function kitchenChart(buckets: InsightsBucket[], grain: Grain): ChartData {
  return {
    ...frame(buckets, grain),
    series: [
      minutesSeries('To accept', 1, buckets.map((b) => b.acceptSeconds)),
      minutesSeries('To prepare', 2, buckets.map((b) => b.prepSeconds)),
      minutesSeries('To serve', 3, buckets.map((b) => b.serveSeconds)),
    ],
  }
}
