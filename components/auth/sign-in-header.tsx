// components/auth/sign-in-header.tsx
// The top line of every sign-in: the wordmark, which door this is, and the light / dark switch.
// The switch is thumb-sized because a kitchen tablet and a waiter's phone sign in here too, and
// it is the first screen a device shows — before any other screen could offer the choice.
import { ThemeToggle } from '@/components/theme-toggle'

/** The wordmark, the portal's name and the theme switch, above either sign-in step. */
export default function SignInHeader({ label }: { label: string }) {
  return (
    <div className="mb-8 flex items-center gap-2 font-semibold">
      <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
      Foodify
      <span className="ml-auto text-xs font-medium text-muted-foreground">{label}</span>
      <ThemeToggle size="icon-lg" className="-my-3 -mr-3 shrink-0" />
    </div>
  )
}
