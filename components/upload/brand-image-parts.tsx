'use client'

// What the logo and cover uploads show around their zone, the same markup with the words and
// sizes of each kind: the section header, the uploaded image as a thumbnail with its URL, and
// the requirements panel.
import Image from 'next/image'
import { ImageIcon, Info } from 'lucide-react'

export type BrandImageKind = 'logo' | 'cover'

const COPY = {
  logo: {
    title: 'Restaurant Logo',
    subtitle: 'JPG, PNG, WebP, or SVG format',
    frameClass: 'w-16 h-16 rounded-lg overflow-hidden border-2 border-white',
    width: 64,
    height: 64,
    uploadedText: 'Logo uploaded successfully',
    requirementsTitle: 'Logo Requirements',
    maxSize: 'Maximum 5MB',
    recommended: 'Square format (1:1 ratio) for best results',
  },
  cover: {
    title: 'Restaurant Cover Image',
    subtitle: 'JPG, PNG, WebP, or SVG format (recommended size: 1200x400px)',
    frameClass: 'w-24 h-16 rounded-lg overflow-hidden border-2 border-white',
    width: 96,
    height: 64,
    uploadedText: 'Cover image uploaded successfully',
    requirementsTitle: 'Cover Image Requirements',
    maxSize: 'Maximum 10MB',
    recommended: '1200x400px for best display results',
  },
} as const

export function BrandImageHeader({ kind }: { kind: BrandImageKind }) {
  const c = COPY[kind]
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-muted rounded-lg">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{c.title}</h4>
        <p className="text-sm text-muted-foreground">{c.subtitle}</p>
      </div>
    </div>
  )
}

interface BrandImageCardProps {
  kind: BrandImageKind
  url: string
  restaurantName: string
}

export function BrandImageCard({ kind, url, restaurantName }: BrandImageCardProps) {
  const c = COPY[kind]
  return (
    <div className="p-4 border border-border rounded-md">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className={c.frameClass}>
            <Image
              src={url}
              alt={`${restaurantName} ${kind}`}
              width={c.width}
              height={c.height}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-success">{c.uploadedText}</p>
          <p className="text-xs text-success break-all mt-1">{url}</p>
        </div>
      </div>
    </div>
  )
}

export function BrandImageRequirements({ kind, restaurantSlug }: { kind: BrandImageKind; restaurantSlug: string }) {
  const c = COPY[kind]
  return (
    <div className="p-4 border border-border rounded-md">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            {c.requirementsTitle}
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Formats:</strong> JPG, PNG, WebP, SVG</p>
            <p><strong>Size:</strong> {c.maxSize}</p>
            <p><strong>Recommended:</strong> {c.recommended}</p>
            <p><strong>Storage:</strong> Automatically optimized and stored in restaurants/{restaurantSlug}/branding/</p>
          </div>
        </div>
      </div>
    </div>
  )
}
