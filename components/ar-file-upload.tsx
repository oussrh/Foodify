"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Camera,
  Loader2,
  CloudUpload,
  FileType,
  Info
} from 'lucide-react'

interface ARFileUploadProps {
  restaurantId: string
  restaurantName: string
  currentUsdzUrl?: string
  currentGlbUrl?: string
  onUsdzUpload: (url: string) => void
  onGlbUpload: (url: string) => void
  onPreview?: (modelUrl: string, modelType: 'usdz' | 'glb') => void
}

interface UploadResult {
  secure_url: string
  public_id: string
  resource_type: string
  format: string
}

export default function ARFileUpload({
  restaurantId,
  restaurantName,
  currentUsdzUrl,
  currentGlbUrl,
  onUsdzUpload,
  onGlbUpload,
  onPreview
}: ARFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState<'usdz' | 'glb' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if Cloudinary is configured
  const isCloudinaryConfigured = !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && 
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  )

  const uploadToCloudinary = async (file: File, type: 'usdz' | 'glb'): Promise<UploadResult> => {
    // Check if Cloudinary is configured
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
    formData.append('folder', `restaurants/${restaurantName.replace(/\s+/g, '_').toLowerCase()}/ar_models`)
    formData.append('resource_type', 'raw')
    formData.append('public_id', `${type}_${Date.now()}`)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'usdz' | 'glb') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const expectedExtension = type === 'usdz' ? '.usdz' : '.glb'
    if (!file.name.toLowerCase().endsWith(expectedExtension)) {
      setError(`Please select a ${expectedExtension} file`)
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }

    setIsUploading(true)
    setUploadType(type)
    setError(null)
    setSuccess(null)

    try {
      const result = await uploadToCloudinary(file, type)
      
      if (type === 'usdz') {
        onUsdzUpload(result.secure_url)
      } else {
        onGlbUpload(result.secure_url)
      }
      
      setSuccess(`${type.toUpperCase()} model uploaded successfully!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(`Failed to upload ${type.toUpperCase()} file. Please try again.`)
    } finally {
      setIsUploading(false)
      setUploadType(null)
      // Reset file input
      event.target.value = ''
    }
  }

  const handlePreview = (modelUrl: string, type: 'usdz' | 'glb') => {
    if (onPreview) {
      onPreview(modelUrl, type)
    } else {
      // Fallback: open in new window
      if (type === 'glb') {
        window.open(`/3d-viewer?model=${encodeURIComponent(modelUrl)}&name=Preview`, '_blank')
      }
    }
  }

  const removeFile = (type: 'usdz' | 'glb') => {
    if (type === 'usdz') {
      onUsdzUpload('')
    } else {
      onGlbUpload('')
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-purple-600" />
          AR Model Upload
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

        {/* Configuration Notice */}
        {!isCloudinaryConfigured && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Configuration Required
                </p>
                <div className="space-y-1 text-sm text-amber-700">
                  <p>To use AR file uploads, please configure the following environment variables:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code></li>
                    <li><code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code></li>
                  </ul>
                  <p className="mt-2">Contact your administrator to enable this feature.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Format Info */}
        {isCloudinaryConfigured && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  AR Model Requirements
                </p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>USDZ:</strong> For iOS devices (iPhone/iPad) - Apple's AR Quick Look</p>
                  <p><strong>GLB:</strong> For Android and web browsers - WebXR compatible</p>
                  <p><strong>File size:</strong> Maximum 50MB per file</p>
                  <p><strong>Folder:</strong> Files will be organized in '{restaurantName.replace(/\s+/g, '_').toLowerCase()}/ar_models'</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Sections - Only show when Cloudinary is configured */}
        {isCloudinaryConfigured ? (
          <>
            {/* USDZ Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  iOS AR Model (USDZ)
                </h4>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  iOS Devices
                </Badge>
              </div>
              
              {currentUsdzUrl ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900">USDZ model uploaded</p>
                      <p className="text-xs text-green-600 break-all">{currentUsdzUrl}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(currentUsdzUrl, 'usdz')}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile('usdz')}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept=".usdz"
                    onChange={(e) => handleFileUpload(e, 'usdz')}
                    disabled={isUploading}
                    className="hidden"
                    id="usdz-upload"
                  />
                  <label htmlFor="usdz-upload" className="cursor-pointer">
                    <div className="space-y-3">
                      {isUploading && uploadType === 'usdz' ? (
                        <>
                          <Loader2 className="h-8 w-8 text-purple-500 mx-auto animate-spin" />
                          <p className="text-sm text-purple-600 font-medium">Uploading USDZ...</p>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="h-8 w-8 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Upload USDZ file</p>
                            <p className="text-xs text-gray-500">Click to browse or drag and drop</p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* GLB Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  Web AR Model (GLB)
                </h4>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  All Devices
                </Badge>
              </div>
              
              {currentGlbUrl ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900">GLB model uploaded</p>
                      <p className="text-xs text-green-600 break-all">{currentGlbUrl}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(currentGlbUrl, 'glb')}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile('glb')}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept=".glb"
                    onChange={(e) => handleFileUpload(e, 'glb')}
                    disabled={isUploading}
                    className="hidden"
                    id="glb-upload"
                  />
                  <label htmlFor="glb-upload" className="cursor-pointer">
                    <div className="space-y-3">
                      {isUploading && uploadType === 'glb' ? (
                        <>
                          <Loader2 className="h-8 w-8 text-purple-500 mx-auto animate-spin" />
                          <p className="text-sm text-purple-600 font-medium">Uploading GLB...</p>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="h-8 w-8 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Upload GLB file</p>
                            <p className="text-xs text-gray-500">Click to browse or drag and drop</p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Upload Status */}
            {(currentUsdzUrl || currentGlbUrl) && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">AR Experience Ready</span>
                </div>
                <div className="space-y-1 text-sm text-purple-700">
                  {currentUsdzUrl && <p>✓ iOS AR Quick Look available</p>}
                  {currentGlbUrl && <p>✓ Web AR experience available</p>}
                  <p className="text-purple-600">Customers can now view this dish in AR!</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Fallback message when Cloudinary is not configured */
          <div className="text-center py-8 text-gray-500">
            <CloudUpload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium">AR File Upload Unavailable</p>
            <p className="text-xs">Cloudinary configuration required</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}