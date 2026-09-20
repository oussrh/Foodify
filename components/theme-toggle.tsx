'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button, type ButtonProps } from './ui/button'
import { useClientValue } from './use-client-value'

export function ThemeToggle({ className, variant = 'ghost', size = 'icon' }: Pick<ButtonProps, 'className' | 'variant' | 'size'>) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useClientValue(() => true, false)

  const isDark = mounted && resolvedTheme === 'dark'
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </Button>
  )
}
