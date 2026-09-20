'use client'

import Image from 'next/image'
import { ImagePlus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TileThumbnailProps {
  /** The current image URL, or '' for the placeholder */
  value: string
  isLogo: boolean
  /** An upload or removal in flight: a spinner over the image */
  busy: boolean
}

/** The tile's picture: the image as it will show, or a placeholder, with a spinner while it changes. */
export default function TileThumbnail({ value, isLogo, busy }: TileThumbnailProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md border border-border bg-muted',
        isLogo ? 'h-16 w-16' : 'aspect-16/7 w-full sm:w-56',
      )}
    >
      {value ? (
        <Image src={value} alt="" fill unoptimized sizes={isLogo ? '64px' : '224px'} className={isLogo ? 'object-contain p-1' : 'object-cover'} />
      ) : (
        <ImagePlus className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
      )}
    </div>
  )
}
