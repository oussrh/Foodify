// PathFile: components/image-upload.tsx
"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageIcon, Camera, CheckCircle2 } from 'lucide-react'
import { isBrowserUploadConfigured, uploadToCloudinary } from '@/components/upload/browser-upload'
import { dishImageTarget } from '@/components/upload/targets'
import { formatFileSize, validateDishImage } from '@/components/upload/file-checks'
import { useUploadProgress } from '@/components/upload/use-upload-progress'
import { ErrorNotice, SuccessNotice } from '@/components/upload/status-notices'
import { DishImageZone } from '@/components/upload/dish-image-zone'
import { DishImagePreview, type DishImageInfo } from '@/components/upload/dish-image-preview'
import { DishImageRequirements, DishImageUnavailable } from '@/components/upload/dish-image-panels'
import SectionIntro from '@/components/forms/section-intro'

interface ImageUploadProps {
  restaurantName: string
  currentImageUrl?: string
  onImageUpload: (url: string) => void
  onPreview?: (imageUrl: string) => void
}

export default function ImageUpload({
  restaurantName,
  currentImageUrl,
  onImageUpload,
  onPreview
}: ImageUploadProps) {
  const { isUploading, uploadProgress, error, success, setError, flashSuccess, track } = useUploadProgress(300)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageInfo, setImageInfo] = useState<DishImageInfo>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if Cloudinary is configured
  const isCloudinaryConfigured = isBrowserUploadConfigured()

  const processFile = async (file: File) => {
    const validationError = validateDishImage(file)
    if (validationError) {
      setError(validationError)
      return
    }

    await track({
      upload: () => uploadToCloudinary(file, dishImageTarget(restaurantName)),
      onUploaded: (result) => {
        // Set image info
        setImageInfo({
          dimensions: result.width && result.height ? `${result.width}×${result.height}` : undefined,
          size: result.bytes ? formatFileSize(result.bytes) : formatFileSize(file.size),
          format: result.format?.toUpperCase() || file.type.split('/')[1]?.toUpperCase()
        })

        onImageUpload(result.secure_url)
        flashSuccess(`Image uploaded successfully! File: ${file.name}`, 5000)
      },
      failure: () => `Failed to upload image: ${file.name}. Please try again.`,
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)

    // Reset file input
    event.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const [file] = e.dataTransfer.files
    if (file) {
      await processFile(file)
    }
  }

  const handlePreview = () => {
    if (currentImageUrl) {
      if (onPreview) {
        onPreview(currentImageUrl)
      } else {
        window.open(currentImageUrl, '_blank')
      }
    }
  }

  const downloadImage = () => {
    if (currentImageUrl) {
      const link = document.createElement('a')
      link.href = currentImageUrl
      link.download = `${restaurantName}_dish_image.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const removeImage = () => {
    onImageUpload('')
    setImageInfo({})
    flashSuccess('Image removed successfully', 3000)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  if (!isCloudinaryConfigured) {
    return <DishImageUnavailable />
  }

  return (
    <div className="space-y-6">
      <SectionIntro icon={Camera} title="Dish Image Upload" description="Add beautiful images to showcase your dishes" />

      <Card className="border-0 overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <span className="text-lg">Image Management</span>
              <p className="mt-1 text-sm font-normal text-muted-foreground">
                Upload and manage dish images with cloud storage
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {success && <SuccessNotice message={success} hint="Your image is ready to use!" icon={CheckCircle2} />}
          {error && <ErrorNotice message={error} />}

          {/* Image Upload Section */}
          <div className="space-y-6">
            {currentImageUrl ? (
              <DishImagePreview
                url={currentImageUrl}
                info={imageInfo}
                onPreview={handlePreview}
                onDownload={downloadImage}
                onReplace={triggerFileSelect}
                onRemove={removeImage}
              />
            ) : (
              <DishImageZone
                isDragOver={isDragOver}
                isUploading={isUploading}
                progress={uploadProgress}
                inputRef={fileInputRef}
                onChange={handleFileUpload}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onChoose={triggerFileSelect}
              />
            )}
          </div>

          <DishImageRequirements restaurantName={restaurantName} />
        </CardContent>
      </Card>
    </div>
  )
}
