// components/menu/dish-photo.tsx
// A dish's photo, or a neutral placeholder when it has none (an image is optional). The caller
// gives the box its size; this fills it.
//
// The photo carries its own positioning context. `fill` positions against the nearest positioned
// ancestor, so a caller whose wrapper was `static` did not get a 48px thumbnail — the photo
// escaped and stretched over the whole order sheet, painting out every line of it. The contract
// was a comment, and a comment is not a contract: it is a `relative` span now.
import Image from 'next/image'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

/** A dish's photo filling the box the caller sizes, or a neutral placeholder when it has none. */
export default function DishPhoto({
  src,
  alt,
  sizes,
  priority,
  iconClassName = 'h-6 w-6',
}: {
  src: string | null
  alt: string
  sizes: string
  priority?: boolean
  iconClassName?: string
}) {
  if (!src) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <Utensils className={cn('opacity-60', iconClassName)} aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className="relative block h-full w-full overflow-hidden">
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority ?? false} className="object-cover" />
    </span>
  )
}
