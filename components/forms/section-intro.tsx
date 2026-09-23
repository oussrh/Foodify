// components/forms/section-intro.tsx
// The centred introduction of an upload section: an icon in a muted box, the title, one line
// under it. The AR-model and dish-image uploads open with it.
import type { LucideIcon } from 'lucide-react'

/**
 * The centred icon, title and one-line lead that open an upload section (the dish image and AR
 * model uploads).
 */
export default function SectionIntro({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
