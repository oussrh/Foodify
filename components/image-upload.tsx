"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  ImageIcon,
  Loader2,
  CloudUpload
} from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  restaurantId: string
  restaurantName: string
  currentImageUrl?: string
  onImageUpload: (url: string) => void
  onPreview?: (imageUrl: string) => void
}

interface UploadResult {
  secure_url: string
  public_id: string
  resource_type: string
  format: string
}

export default function ImageUpload({
  restaurantId,
  restaurantName,
  currentImageUrl,
  onImageUpload,
  onPreview
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if Cloudinary is configured
  const isCloudinaryConfigured = !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && 
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  )

  const uploadToCloudinary = async (file: File): Promise<UploadResult> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    
    if (!cloudName) {
      throw new Error('Cloudinary cloud name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment variables.')
    }
    
    if (!uploadPreset) {
      throw new Error('Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', `restaurants/${restaurantName.replace(/\s+/g, '_').toLowerCase()}/dishes`)
    formData.append('resource_type', 'image')
    formData.append('public_id', `dish_${Date.now()}`)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Cloudinary upload error:', errorData)
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(`Cloudinary error: ${result.error.message}`)
      }

      return result
    } catch (error) {
      console.error('Upload error details:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred during upload')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB for images)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await uploadToCloudinary(file)
      onImageUpload(result.secure_url)
      setSuccess('Image uploaded successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      event.target.value = ''
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

  const removeImage = () => {
    onImageUpload('')
  }

  if (!isCloudinaryConfigured) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            Dish Image Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Configuration Required
                </p>
                <p className="text-sm text-amber-700">
                  Please configure Cloudinary environment variables to enable image uploads.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Dish Image Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Image Upload Section */}
        <div className="space-y-4">
          {currentImageUrl ? (
            /* Image Preview */
            <div className="space-y-3">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={currentImageUrl}
                  alt="Dish preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                <div className="text-xs text-gray-500 flex-1 min-w-0">
                  <p className="truncate">{currentImageUrl}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="space-y-4">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
                      <p className="text-sm text-blue-600 font-medium">Uploading image...</p>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">Upload Dish Image</p>
                        <p className="text-sm text-gray-500 mt-1">Click to browse or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-2">Supports: JPG, PNG, WebP (max 10MB)</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Image Requirements */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Image Requirements
              </p>
              <div className="space-y-1 text-sm text-blue-700">
                <p>• <strong>Format:</strong> JPG, PNG, WebP, or GIF</p>
                <p>• <strong>Size:</strong> Maximum 10MB</p>
                <p>• <strong>Recommended:</strong> At least 800x600 pixels for best quality</p>
                <p>• <strong>Folder:</strong> Images will be organized in '{restaurantName.replace(/\s+/g, '_').toLowerCase()}/dishes'</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}