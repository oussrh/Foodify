'use client'

import { useEffect, useRef, useState } from 'react'
import type { Section } from './use-menu-filters'

const BAR_HEIGHT = 56
const CHIPS_HEIGHT = 50

// Sections are found by their ids (set by MenuSections) from the scroll listener and the jump handler.
const sectionEl = (id: string) => document.getElementById(`section-${id}`)

/**
 * The hero collapses once it scrolls under the sticky bar, and the bar's chips follow the
 * section under the reader: which one is current, kept in view, and a smooth jump to any.
 */
export function useScrollSpy(sections: Section[]) {
  const heroRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const io = new IntersectionObserver(([entry]) => setCollapsed(entry ? !entry.isIntersecting : false), {
      rootMargin: `-${BAR_HEIGHT}px 0px 0px 0px`,
      threshold: 0,
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const line = BAR_HEIGHT + CHIPS_HEIGHT + 12
        let current: string | null = null
        for (const s of sections) {
          const el = sectionEl(s.id)
          if (el && el.getBoundingClientRect().top <= line) current = s.id
        }
        setActiveSection(current ?? sections[0]?.id ?? null)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [sections])

  // Keep the active chip in view as the reader scrolls
  useEffect(() => {
    if (!activeSection || !chipsRef.current) return
    const chip = chipsRef.current.querySelector<HTMLElement>(`[data-chip="${activeSection}"]`)
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeSection])

  const jumpTo = (id: string) => {
    sectionEl(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return { heroRef, chipsRef, activeSection, collapsed, jumpTo }
}
