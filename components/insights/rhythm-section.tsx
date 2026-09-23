// components/insights/rhythm-section.tsx
// When and on what: the week's busy hours, and the phones the menu is read on with how often
// each one launches AR (AR is Quick Look on an iPhone and Scene Viewer on Android, so a gap
// between the two is a finding about the models, not about the guests).
import { conversion } from '@/lib/insights'
import type { RhythmGrid } from '@/lib/insights-rhythm'
import { BarList } from '@/components/insights/charts/bar-list'
import { ChartCard } from '@/components/insights/charts/chart-card'
import { RhythmHeatmap } from '@/components/insights/charts/rhythm-heatmap'

const DEVICE_LABEL: Record<string, string> = { iOS: 'iPhone and iPad', Android: 'Android', Other: 'Other devices' }

interface RhythmSectionProps {
  rhythm: RhythmGrid
  devices: { device: string; views: number; arViews: number }[]
  ordering: boolean
}

/**
 * When and on what: the week's busy hours as a heatmap, and the phones the menu is read on with
 * their AR rate.
 */
export function RhythmSection({ rhythm, devices, ordering }: RhythmSectionProps) {
  const noun = ordering ? 'orders' : 'dishes opened'
  const total = devices.reduce((n, d) => n + d.views, 0)
  const rows = [...devices]
    .sort((a, b) => b.views - a.views)
    .map((d) => ({
      key: d.device,
      label: DEVICE_LABEL[d.device] ?? d.device,
      value: d.views,
      display: `${conversion(d.views, total) ?? 0}%`,
      note: `${d.views.toLocaleString('en-GB')} opens · ${conversion(d.arViews, d.views) ?? 0}% in AR`,
    }))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Busiest hours" description={`${ordering ? 'Orders' : 'Dishes opened'} by weekday and hour.`} className="lg:col-span-2">
        <RhythmHeatmap grid={rhythm} noun={noun} />
      </ChartCard>
      <ChartCard title="Devices" description="Share of dishes opened, by the guest's phone.">
        <BarList rows={rows} max={Math.max(1, total)} slot={2} empty="No dish has been opened in this period." />
      </ChartCard>
    </div>
  )
}
