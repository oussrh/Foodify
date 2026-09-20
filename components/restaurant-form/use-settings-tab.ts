// components/restaurant-form/use-settings-tab.ts
// The settings form's active section. It lives in the URL (`?tab=`) so a reload or a shared
// link lands on the same section; the first render reads it on the client only.
import { useCallback, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'
import { TABS, type SettingsTab } from './settings-tabs'

export function useSettingsTab() {
  // The active tab lives in the URL so a reload (or a shared link) lands on the same section.
  const urlTab = useClientValue(() => new URLSearchParams(window.location.search).get('tab'), null)
  const [pickedTab, setActiveTab] = useState<SettingsTab | null>(null)
  const activeTab: SettingsTab = pickedTab ?? TABS.find((tab) => tab.key === urlTab)?.key ?? 'general'
  const showTab = useCallback((tab: SettingsTab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState(window.history.state, '', url)
  }, [])
  return { activeTab, showTab }
}
