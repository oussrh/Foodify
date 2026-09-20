"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Loader2,
  CloudUpload,
  ImageIcon,
  Info,
  Download,
} from 'lucide-react'
import Image from 'next/image'
import { uploadRestaurantLogo, updateRestaurant } from '@/app/actions/restaurant-actions'

interface RestaurantLogoUploadProps {
  restaurantId?: string
  restaurantSlug: string
  restaurantName: string
  currentLogoUrl?: string
  onLogoUpload: (url: string) => void
  disabled?: boolean
}

interface UploadResult {
  secure_url: string
  public_id: string
  resource_type: string
  format: string
}

export default function RestaurantLogoUpload({
  restaurantId,
  restaurantSlug,
  restaurantName,
  currentLogoUrl,
  onLogoUpload,
  disabled = false
}: RestaurantLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

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
    formData.append('folder', `restaurants/${restaurantSlug}/branding`)
    
    // Use fixed public ID for restaurant logo (will replace existing)
    const publicId = `logo`
    formData.append('public_id', publicId)

    try {
      // Use simple image upload endpoint - let Cloudinary handle resource type detection
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
        
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, WebP, or SVG)')
      event.target.value = ''
      return
    }

    // Check for files with double extensions
    if (file.name.match(/\.(svg|png|jpg|jpeg|webp)\.(png|jpg|jpeg|webp)$/i)) {
      setError('File appears to have a double extension. Please rename the file and try again.')
      event.target.value = ''
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File size must be less than 5MB. Current size: ${formatFileSize(file.size)}`)
      event.target.value = ''
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
      let result
      try {
        // Try client-side upload first
        result = await uploadToCloudinary(file)
      } catch (clientError) {
        console.warn('Client-side upload failed, trying server-side upload:', clientError)
        
        // Fallback to server-side upload
        const formData = new FormData()
        formData.append('file', file)
        
        const serverResult = await uploadRestaurantLogo(formData, restaurantSlug)
        
        if (!serverResult.success) {
          throw new Error(serverResult.error || 'Server-side upload failed')
        }
        
        result = { secure_url: serverResult.logoUrl }
      }
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const logoUrl = result.secure_url || ''
      console.log('Setting logo URL:', logoUrl)
      
      // Auto-save the logo URL to the database immediately (only if restaurant exists)
      if (restaurantId) {
        try {
          await updateRestaurant(restaurantId, { logoUrl })
          console.log('Logo saved to database successfully')
          onLogoUpload(logoUrl)
          setSuccess(`Logo uploaded and saved successfully! File: ${file.name}`)
        } catch (saveError) {
          console.error('Failed to save logo to database:', saveError)
          onLogoUpload(logoUrl)
          setSuccess(`Logo uploaded successfully, but you may need to save the form manually. File: ${file.name}`)
        }
      } else {
        // For new restaurants, just update the form state
        onLogoUpload(logoUrl)
        setSuccess(`Logo uploaded successfully! File: ${file.name}`)
      }
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to upload logo: ${file.name}. ${errorMessage}`)
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
      // Reset file input
      event.target.value = ''
    }
  }

  const handlePreview = (logoUrl: string) => {
    window.open(logoUrl, '_blank')
  }

  const removeLogo = () => {
    onLogoUpload('')
    setSuccess('Logo removed successfully')
    setTimeout(() => setSuccess(null), 3000)
  }

  const downloadLogo = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${restaurantName.replace(/\s+/g, '_')}_logo`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isCloudinaryConfigured) {
    return (
      <div className="space-y-4">
        <div className="p-6 border border-border rounded-md">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-warning mb-2">
                Configuration Required
              </p>
              <div className="space-y-3 text-sm text-warning">
                <p>To enable logo uploads, please configure these environment variables:</p>
                <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs">
                  <div>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</div>
                  <div>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</div>
                </div>
                <p className="text-warning">Contact your administrator to enable this feature.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-4 border border-border rounded-md flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-success">{success}</p>
            <p className="text-xs text-success mt-1">Your restaurant logo is ready!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 border border-border rounded-md flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-destructive mt-1">Please check your file and try again</p>
          </div>
        </div>
      )}

      {/* Logo Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Restaurant Logo</h4>
            <p className="text-sm text-muted-foreground">JPG, PNG, WebP, or SVG format</p>
          </div>
        </div>
        
        {currentLogoUrl ? (
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-md">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white">
                    <Image
                      src={currentLogoUrl}
                      alt={`${restaurantName} logo`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-success">Logo uploaded successfully</p>
                  <p className="text-xs text-success break-all mt-1">{currentLogoUrl}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreview(currentLogoUrl)}
                className="border-border text-muted-foreground hover:bg-muted"
                disabled={disabled}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadLogo(currentLogoUrl)}
                className="border-border text-muted-foreground hover:bg-muted"
                disabled={disabled}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeLogo}
                className="border-border text-destructive hover:bg-muted"
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-md p-8 text-center hover:border-border-strong hover:bg-muted transition-colors group">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              disabled={disabled || isUploading}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className={`cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
              <div className="space-y-4">
                {isUploading ? (
                  <>
                    <div className="relative">
                      <Loader2 className="h-10 w-10 text-muted-foreground mx-auto animate-spin" />
                      <div className="absolute inset-0 bg-muted rounded-full opacity-20"></div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Uploading logo...</p>
                      <div className="mt-2 w-full bg-muted rounded-full h-2 max-w-xs mx-auto">
                        <div 
                          className="bg-primary h-2 rounded-full transition-colors"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round(uploadProgress)}%</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-10 w-10 text-muted-foreground mx-auto group-hover:text-muted-foreground transition-colors" />
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-muted-foreground">Upload restaurant logo</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-2">Supports: JPG, PNG, WebP, SVG (max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>
        )}
      </div>

      {/* File Format Info */}
      <div className="p-4 border border-border rounded-md">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Logo Requirements
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Formats:</strong> JPG, PNG, WebP, SVG</p>
              <p><strong>Size:</strong> Maximum 5MB</p>
              <p><strong>Recommended:</strong> Square format (1:1 ratio) for best results</p>
              <p><strong>Storage:</strong> Automatically optimized and stored in restaurants/{restaurantSlug}/branding/</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}