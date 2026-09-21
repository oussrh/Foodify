// components/menu/social-list.tsx
// The restaurant's social links, shown as icons or as text labels (the restaurant's choice,
// Settings → Contact). One link per network it filled in, in the registry's order. The footer
// and the settings preview both use it.
import { SOCIAL_ICONS } from '@/components/social-icons'
import { cn } from '@/lib/utils'
import { SOCIAL_NETWORKS, socialUrl, type SocialHandles } from '@/lib/social'

const iconLink = 'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-border-strong hover:text-foreground'
const textLink = 'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-border-strong hover:text-foreground'

export default function SocialList({ handles, display, className }: { handles: SocialHandles; display: 'icons' | 'text'; className?: string }) {
  const shown = SOCIAL_NETWORKS.filter((n) => handles[n.key])
  if (shown.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {shown.map((n) => {
        const Icon = SOCIAL_ICONS[n.key]
        const href = socialUrl(n.key, handles[n.key] as string)
        if (display === 'text') {
          return (
            <a key={n.key} href={href} target="_blank" rel="noopener noreferrer" className={textLink}>
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              {n.label}
            </a>
          )
        }
        return (
          <a key={n.key} href={href} target="_blank" rel="noopener noreferrer" aria-label={n.label} className={iconLink}>
            {Icon && <Icon className="h-4 w-4" />}
          </a>
        )
      })}
    </div>
  )
}
