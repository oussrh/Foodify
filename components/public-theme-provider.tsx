"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const systemTheme = mediaQuery.matches ? 'dark' : 'light'

    // Check localStorage for user preference (if they manually toggle later)
    const storedTheme = localStorage.getItem('restaurant-theme') as Theme | null

    const initialTheme = storedTheme || systemTheme
    setTheme(initialTheme)

    // Apply theme to document
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')

    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('restaurant-theme')) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('restaurant-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
