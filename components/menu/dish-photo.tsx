// components/menu/dish-photo.tsx
// A dish's photo, or a neutral placeholder when it has none (an image is optional). The row uses
// a small square, the sheet a 4:3; both pass their own sizing on the wrapper.
import Image from 'next/image'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority ?? false} className="object-cover" />
}
