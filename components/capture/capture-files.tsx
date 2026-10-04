// components/capture/capture-files.tsx
// The two file fields of the capture form: the video (one), and the HD photos taken with it (up to
// eight, JPEG or PNG). An iPhone hands a web page JPEG when the field asks for it, so its default
// HEIC is not a problem here; a HEIC chosen another way is refused by the schema, with the setting.
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX_PHOTOS } from '@/lib/schemas/capture'

/** The form fields a file refusal can be about. */
export type FileField = 'video' | 'photos'

type Props = {
  id: string
  photos: File[]
  onVideo: (file: File | null) => void
  onPhotos: (files: File[]) => void
  /** The field the form's refusal is about, if it is one of these; it is then tied to `issueId`. */
  invalid?: string | undefined
  issueId: string
}

/** The video field and the photos field, with what each takes. */
export function CaptureFiles({ id, photos, onVideo, onPhotos, invalid, issueId }: Props) {
  const flag = (field: FileField) => ({
    'aria-invalid': invalid === field || undefined,
    'aria-describedby': invalid === field ? `${issueId} ${id}-${field}-help` : `${id}-${field}-help`,
  })
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-video`}>The video</Label>
        <Input id={`${id}-video`} className="h-12" type="file" accept="video/mp4,video/quicktime,video/*" onChange={(e) => onVideo(e.target.files?.[0] ?? null)} {...flag('video')} />
        <p id={`${id}-video-help`} className="text-sm text-muted-foreground">
          The three circles, 1 to 1½ minutes. Up to 2 GB with the photos.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-photos`}>The photos (recommended)</Label>
        <Input id={`${id}-photos`} className="h-12" type="file" multiple accept="image/jpeg,image/png" onChange={(e) => onPhotos(Array.from(e.target.files ?? []))} {...flag('photos')} />
        <p id={`${id}-photos-help`} className="text-sm text-muted-foreground">
          {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''} chosen. ` : ''}
          About 4, up to {MAX_PHOTOS}: one from straight above, three around the plate. They make the model sharper.
        </p>
      </div>
    </>
  )
}
