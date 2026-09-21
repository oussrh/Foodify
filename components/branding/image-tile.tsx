'use client'

import { useId, useRef, useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadRestaurantCover, uploadRestaurantLogo } from '@/app/actions/restaurant-actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BRAND_IMAGE_LIMITS, uploadBrandImage, validateBrandImage, type BrandImageKind } from '@/lib/brand-upload'
import TileThumbnail from './tile-thumbnail'

interface ImageTileProps {
  kind: BrandImageKind
  label: string
  value: string
  restaurantSlug: string
  /** Called with the new URL after a successful upload, or '' on remove. */
  onChange: (url: string) => void
  /** Persist immediately (uploads are saved as soon as they finish). */
  onPersist?: (url: string) => Promise<void>
  disabled?: boolean | undefined
}

export default function ImageTile({ kind, label, value, restaurantSlug, onChange, onPersist, disabled }: ImageTileProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const limits = BRAND_IMAGE_LIMITS[kind]

  const handleFile = async (file: File | undefined) => {
    if (!file || busy || disabled) return
    const problem = validateBrandImage(file, kind)
    if (problem) {
      toast.error(problem)
      return
    }
    setBusy(true)
    try {
      const url = await uploadBrandImage(file, kind, restaurantSlug, kind === 'logo' ? uploadRestaurantLogo : uploadRestaurantCover)
      onChange(url)
      if (onPersist) await onPersist(url)
      toast.success(kind === 'logo' ? 'Logo updated' : 'Cover updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async () => {
    onChange('')
    if (onPersist) {
      try {
        await onPersist('')
        toast.success(kind === 'logo' ? 'Logo removed' : 'Cover removed')
      } catch {
        toast.error('Could not remove the image')
      }
    }
  }

  const isLogo = kind === 'logo'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex gap-4 rounded-lg border border-border bg-card p-3 transition-colors',
          dragging && 'border-primary bg-primary/5',
          isLogo ? 'items-center' : 'flex-col sm:flex-row sm:items-center',
        )}
      >
        <TileThumbnail value={value} isLogo={isLogo} busy={busy} />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs text-muted-foreground">{limits.hint}. Saved as soon as it uploads.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy || disabled} onClick={() => inputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" disabled={busy || disabled} onClick={remove} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          aria-label={`Choose a ${label.toLowerCase()} file`}
          accept={limits.types.join(',')}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={busy || disabled}
        />
      </div>
    </div>
  )
}
