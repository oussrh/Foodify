"use client"

import { useState, useCallback } from 'react'
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
  Info,
  Download,
  RefreshCw,
  Smartphone,
  Monitor,
  Globe,
  Apple,
  Zap
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
  const [uploadProgress, setUploadProgress] = useState(0)

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
    formData.append('folder', `restaurants/${restaurantName.replace(/\s+/g, '_').toLowerCase()}/ar`)
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      setError(`File size must be less than 50MB. Current size: ${formatFileSize(file.size)}`)
      return
    }

    setIsUploading(true)
    setUploadType(type)
    setError(null)
    setSuccess(null)
    setUploadProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 20
        return newProgress > 90 ? 90 : newProgress
      })
    }, 500)

    try {
      const result = await uploadToCloudinary(file, type)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (type === 'usdz') {
        onUsdzUpload(result.secure_url)
      } else {
        onGlbUpload(result.secure_url)
      }
      
      setSuccess(`${type.toUpperCase()} model uploaded successfully! File: ${file.name}`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Upload error:', err)
      setError(`Failed to upload ${type.toUpperCase()} file: ${file.name}. Please try again.`)
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadType(null)
        setUploadProgress(0)
      }, 1000)
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
      } else {
        // For USDZ, open directly (will work on iOS Safari)
        window.open(modelUrl, '_blank')
      }
    }
  }

  const removeFile = (type: 'usdz' | 'glb') => {
    if (type === 'usdz') {
      onUsdzUpload('')
    } else {
      onGlbUpload('')
    }
    setSuccess(`${type.toUpperCase()} model removed successfully`)
    setTimeout(() => setSuccess(null), 3000)
  }

  const downloadFile = (url: string, type: 'usdz' | 'glb') => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${restaurantName}_${type}_model.${type}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center">
          <Camera className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">AR Model Management</h2>
          <p className="text-muted-foreground">Upload 3D models to enable AR experiences for your dishes</p>
        </div>
      </div>

      <Card className="border-0 overflow-hidden">
        <CardHeader className="text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-card/20 rounded-lg">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg">AR Model Upload</span>
              <p className="text-purple-100 text-sm font-normal mt-1">
                Bring your dishes to life with augmented reality
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Success Message */}
          {success && (
            <div className="p-4 border border-border rounded-md flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-success">{success}</p>
                <p className="text-xs text-success mt-1">Your AR experience is ready!</p>
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

          {/* Configuration Notice */}
          {!isCloudinaryConfigured && (
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
                    <p>To enable AR file uploads, please configure these environment variables:</p>
                    <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs">
                      <div>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</div>
                      <div>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</div>
                    </div>
                    <p className="text-warning">Contact your administrator to enable this feature.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Format Info */}
          {isCloudinaryConfigured && (
            <div className="p-6 border border-border rounded-md">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                  <Info className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-muted-foreground mb-3">
                    AR Model Requirements
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Apple className="h-4 w-4" />
                        <span className="font-medium">USDZ Format</span>
                      </div>
                      <p className="text-muted-foreground">iOS devices (iPhone/iPad) - Apple&apos;s AR Quick Look</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium">GLB Format</span>
                      </div>
                      <p className="text-muted-foreground">Android and web browsers - WebXR compatible</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-1 text-sm text-muted-foreground">
                    <p><strong>File size:</strong> Maximum 50MB per file</p>
                    <p><strong>Storage:</strong> Files organized in &apos;{restaurantName.replace(/\s+/g, '_').toLowerCase()}/ar&apos;</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Sections - Only show when Cloudinary is configured */}
          {isCloudinaryConfigured ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* USDZ Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">iOS AR Model</h4>
                      <p className="text-sm text-muted-foreground">USDZ format</p>
                    </div>
                  </div>
                  <Badge className="bg-muted text-muted-foreground border-border flex items-center gap-1">
                    <Apple className="h-3 w-3" />
                    iOS Only
                  </Badge>
                </div>
                
                {currentUsdzUrl ? (
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-md">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-success">USDZ model uploaded</p>
                          <p className="text-xs text-success break-all mt-1">{currentUsdzUrl}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(currentUsdzUrl, 'usdz')}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(currentUsdzUrl, 'usdz')}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile('usdz')}
                        className="border-border text-destructive hover:bg-muted"
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
                      accept=".usdz"
                      onChange={(e) => handleFileUpload(e, 'usdz')}
                      disabled={isUploading}
                      className="hidden"
                      id="usdz-upload"
                    />
                    <label htmlFor="usdz-upload" className="cursor-pointer">
                      <div className="space-y-4">
                        {isUploading && uploadType === 'usdz' ? (
                          <>
                            <div className="relative">
                              <Loader2 className="h-10 w-10 text-muted-foreground mx-auto animate-spin" />
                              <div className="absolute inset-0 bg-muted rounded-full opacity-20"></div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground font-medium">Uploading USDZ...</p>
                              <div className="mt-2 w-full bg-muted rounded-full h-2">
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
                              <p className="text-sm font-medium text-foreground group-hover:text-muted-foreground">Upload USDZ file</p>
                              <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
                              <p className="text-xs text-muted-foreground mt-2">For iOS AR Quick Look</p>
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* GLB Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Monitor className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Web AR Model</h4>
                      <p className="text-sm text-muted-foreground">GLB format</p>
                    </div>
                  </div>
                  <Badge className="bg-muted text-success border-border flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    All Devices
                  </Badge>
                </div>
                
                {currentGlbUrl ? (
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-md">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-success">GLB model uploaded</p>
                          <p className="text-xs text-success break-all mt-1">{currentGlbUrl}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(currentGlbUrl, 'glb')}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(currentGlbUrl, 'glb')}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile('glb')}
                        className="border-border text-destructive hover:bg-muted"
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
                      accept=".glb"
                      onChange={(e) => handleFileUpload(e, 'glb')}
                      disabled={isUploading}
                      className="hidden"
                      id="glb-upload"
                    />
                    <label htmlFor="glb-upload" className="cursor-pointer">
                      <div className="space-y-4">
                        {isUploading && uploadType === 'glb' ? (
                          <>
                            <div className="relative">
                              <Loader2 className="h-10 w-10 text-success mx-auto animate-spin" />
                              <div className="absolute inset-0 bg-muted rounded-full opacity-20"></div>
                            </div>
                            <div>
                              <p className="text-sm text-success font-medium">Uploading GLB...</p>
                              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-colors"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-success mt-1">{Math.round(uploadProgress)}%</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <CloudUpload className="h-10 w-10 text-muted-foreground mx-auto group-hover:text-success transition-colors" />
                            <div>
                              <p className="text-sm font-medium text-foreground group-hover:text-success">Upload GLB file</p>
                              <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
                              <p className="text-xs text-success mt-2">For web and Android AR</p>
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Fallback message when Cloudinary is not configured */
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-muted rounded-lg flex items-center justify-center mb-4">
                <CloudUpload className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">AR Upload Unavailable</h3>
              <p className="text-sm text-muted-foreground">Cloudinary configuration required to enable this feature</p>
            </div>
          )}

          {/* Upload Status */}
          {(currentUsdzUrl || currentGlbUrl) && (
            <div className="p-6 border border-border rounded-md">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-md flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    🎉 AR Experience Ready!
                  </h3>
                  <div className="space-y-2 text-sm">
                    {currentUsdzUrl && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Apple className="h-4 w-4" />
                        <span>iOS AR Quick Look available</span>
                      </div>
                    )}
                    {currentGlbUrl && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>Web AR experience available</span>
                      </div>
                    )}
                    <p className="text-muted-foreground font-medium mt-3">
                      Customers can now view this dish in augmented reality!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
