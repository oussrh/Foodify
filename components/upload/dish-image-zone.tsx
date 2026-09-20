'use client'

// The dish image drop zone: a drag-and-drop area with a hidden input behind a "Choose Image"
// button, showing the progress pane while the file is on its way.
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { CloudUpload, Loader2, Upload } from 'lucide-react'

interface DishImageZoneProps {
  isDragOver: boolean
  isUploading: boolean
  progress: number
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDragOver: (event: DragEvent) => void
  onDragLeave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
  /** Opens the file dialog. */
  onChoose: () => void
}

export function DishImageZone({ isDragOver, isUploading, progress, inputRef, onChange, onDragOver, onDragLeave, onDrop, onChoose }: DishImageZoneProps) {
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
 isDragOver
 ? 'border-border-strong bg-muted'
 : isUploading
 ? 'border-border-strong bg-muted'
 : 'border-border hover:border-border-strong hover:bg-muted'
 }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        disabled={isUploading}
        className="hidden"
        id="image-upload"
      />

      <div className="space-y-6">
        {isUploading ? (
          <>
            <div className="relative">
              <Loader2 className="h-16 w-16 text-muted-foreground mx-auto animate-spin" />
              <div className="absolute inset-0 bg-muted rounded-full opacity-20"></div>
            </div>
            <div>
              <p className="text-lg font-medium text-muted-foreground mb-2">Uploading image...</p>
              <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-3 rounded-full transition-colors"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <CloudUpload className={`h-16 w-16 mx-auto transition-colors ${
 isDragOver ? 'text-muted-foreground' : 'text-muted-foreground'
 }`} />
              {isDragOver && (
                <div className="absolute inset-0 bg-muted rounded-full opacity-20"></div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isDragOver ? 'Drop your image here' : 'Upload Dish Image'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isDragOver
                  ? 'Release to upload your image'
                  : 'Drag and drop an image file, or click to browse'
                }
              </p>
              <Button
                onClick={onChoose}
                className="transition-colors"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Supports: JPG, PNG, WebP, GIF (max 10MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
