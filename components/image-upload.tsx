// PathFile: components/image-upload.tsx
"use client"

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  ImageIcon,
  Loader2,
  CloudUpload,
  RefreshCw,
  Download,
  Camera,
  Maximize2,
  FileImage,
  Zap,
  Info,
  Sparkles,
  CheckCircle2
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
  width?: number
  height?: number
  bytes?: number
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageInfo, setImageInfo] = useState<{
    dimensions?: string
    size?: string
    format?: string
  }>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if Cloudinary is configured
  const isCloudinaryConfigured = !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && 
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadToCloudinary = useCallback(async (file: File): Promise<UploadResult> => {
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
  }, [restaurantName])

  const validateFile = useCallback((file: File): string | null => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (JPG, PNG, WebP, or GIF)'
    }

    // Check specific formats
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return 'Unsupported image format. Please use JPG, PNG, WebP, or GIF'
    }

    // Validate file size (max 10MB for images)
    if (file.size > 10 * 1024 * 1024) {
      return `Image size must be less than 10MB. Current size: ${formatFileSize(file.size)}`
    }

    return null
  }, [])

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)
    setUploadProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 20
        return newProgress > 90 ? 90 : newProgress
      })
    }, 300)

    try {
      const result = await uploadToCloudinary(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Set image info
      setImageInfo({
        dimensions: result.width && result.height ? `${result.width}×${result.height}` : undefined,
        size: result.bytes ? formatFileSize(result.bytes) : formatFileSize(file.size),
        format: result.format?.toUpperCase() || file.type.split('/')[1]?.toUpperCase()
      })
      
      onImageUpload(result.secure_url)
      setSuccess(`Image uploaded successfully! File: ${file.name}`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Upload error:', err)
      setError(`Failed to upload image: ${file.name}. Please try again.`)
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    }
  }, [onImageUpload, uploadToCloudinary, validateFile])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
    
    // Reset file input
    event.target.value = ''
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFile(files[0])
    }
  }, [processFile])

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
    setSuccess('Image removed successfully')
    setTimeout(() => setSuccess(null), 3000)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  if (!isCloudinaryConfigured) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-muted0/20 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Image Upload Unavailable</h2>
          <p className="text-muted-foreground">Configuration required to enable this feature</p>
        </div>

        <Card className="border-0 overflow-hidden">
          <CardHeader className="text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-card/20 rounded-lg">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span>Dish Image Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="p-6 border border-border rounded-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-warning mb-2">
                    Configuration Required
                  </p>
                  <div className="space-y-3 text-sm text-warning">
                    <p>To enable image uploads, please configure these environment variables:</p>
                    <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs">
                      <div>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</div>
                      <div>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</div>
                    </div>
                    <p className="text-warning">Contact your administrator to enable this feature.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center">
          <Camera className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dish Image Upload</h2>
          <p className="text-muted-foreground">Add beautiful images to showcase your dishes</p>
        </div>
      </div>

      <Card className="border-0 overflow-hidden">
        <CardHeader className="text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-card/20 rounded-lg">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg">Image Management</span>
              <p className="text-blue-100 text-sm font-normal mt-1">
                Upload and manage dish images with cloud storage
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Success Message */}
          {success && (
            <div className="p-4 border border-border rounded-md flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-success">{success}</p>
                <p className="text-xs text-success mt-1">Your image is ready to use!</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 border border-border rounded-md flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <p className="text-xs text-destructive mt-1">Please check your file and try again</p>
              </div>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="space-y-6">
            {currentImageUrl ? (
              /* Image Preview */
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={currentImageUrl}
                    alt="Dish preview"
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
                  
                  {/* Image overlay with info */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-card/90 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium text-foreground">Image uploaded</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {imageInfo.format && (
                            <Badge className="bg-muted text-muted-foreground border-border text-xs">
                              {imageInfo.format}
                            </Badge>
                          )}
                          {imageInfo.dimensions && (
                            <Badge className="bg-muted text-muted-foreground border-border text-xs">
                              {imageInfo.dimensions}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Image Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    className="border-border text-muted-foreground hover:bg-muted hover:border-border"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadImage}
                    className="border-border text-muted-foreground hover:bg-muted hover:border-border"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={triggerFileSelect}
                    className="border-border text-success hover:bg-muted hover:border-border"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Replace
                  </Button>
                  <Button
                    variant="outline"
                    onClick={removeImage}
                    className="border-border text-destructive hover:bg-muted hover:border-border"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>

                {/* Image Details */}
                {(imageInfo.dimensions || imageInfo.size) && (
                  <div className="p-4 border border-border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Image Details</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      {imageInfo.dimensions && (
                        <div>
                          <span className="font-medium">Dimensions:</span>
                          <br />
                          <span>{imageInfo.dimensions} px</span>
                        </div>
                      )}
                      {imageInfo.size && (
                        <div>
                          <span className="font-medium">File Size:</span>
                          <br />
                          <span>{imageInfo.size}</span>
                        </div>
                      )}
                      {imageInfo.format && (
                        <div>
                          <span className="font-medium">Format:</span>
                          <br />
                          <span>{imageInfo.format}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Upload Area */
              <div 
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
 isDragOver 
 ? 'border-border-strong bg-muted' 
 : isUploading 
 ? 'border-border-strong bg-muted'
 : 'border-border hover:border-border-strong hover:bg-muted'
 }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
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
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{Math.round(uploadProgress)}% complete</p>
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
                          onClick={triggerFileSelect}
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
            )}
          </div>

          {/* Image Requirements */}
          <div className="p-6 border border-border rounded-md">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                <FileImage className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-muted-foreground mb-3">
                  Image Requirements & Tips
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Technical Requirements</span>
                    </div>
                    <ul className="space-y-1 text-muted-foreground ml-6">
                      <li>• Format: JPG, PNG, WebP, or GIF</li>
                      <li>• Maximum size: 10MB</li>
                      <li>• Minimum: 400×300 pixels</li>
                      <li>• Recommended: 800×600 pixels or higher</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">Best Practices</span>
                    </div>
                    <ul className="space-y-1 text-muted-foreground ml-6">
                      <li>• Use good lighting and clear focus</li>
                      <li>• Show the complete dish</li>
                      <li>• Use appetizing angles</li>
                      <li>• Avoid busy backgrounds</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Storage:</strong> Images will be organized in &apos;{restaurantName.replace(/\s+/g, '_').toLowerCase()}/dishes&apos; folder
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
