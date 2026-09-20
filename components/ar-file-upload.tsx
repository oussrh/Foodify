"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera } from 'lucide-react'
import { isBrowserUploadConfigured, uploadToCloudinary } from '@/components/upload/browser-upload'
import { arModelTarget, type ArModelType } from '@/components/upload/targets'
import { validateArModel } from '@/components/upload/file-checks'
import { useUploadProgress } from '@/components/upload/use-upload-progress'
import { ConfigurationNotice, ErrorNotice, SuccessNotice } from '@/components/upload/status-notices'
import { ArModelSection } from '@/components/upload/ar-model-section'
import { ArReadyStatus, ArRequirements, ArUploadUnavailable } from '@/components/upload/ar-model-panels'

interface ARFileUploadProps {
  restaurantName: string
  currentUsdzUrl?: string
  currentGlbUrl?: string
  onUsdzUpload: (url: string) => void
  onGlbUpload: (url: string) => void
  onPreview?: (modelUrl: string, modelType: 'usdz' | 'glb') => void
}

export default function ARFileUpload({
  restaurantName,
  currentUsdzUrl,
  currentGlbUrl,
  onUsdzUpload,
  onGlbUpload,
  onPreview
}: ARFileUploadProps) {
  const [uploadType, setUploadType] = useState<ArModelType | null>(null)
  const { isUploading, uploadProgress, error, success, setError, flashSuccess, track } = useUploadProgress(500)

  // Check if Cloudinary is configured
  const isCloudinaryConfigured = isBrowserUploadConfigured()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: ArModelType) => {
    const file = event.target.files?.[0]
    if (!file) return

    const problem = validateArModel(file, type)
    if (problem) {
      setError(problem)
      return
    }

    setUploadType(type)
    await track({
      upload: () => uploadToCloudinary(file, arModelTarget(restaurantName, type)),
      onUploaded: (result) => {
        if (type === 'usdz') {
          onUsdzUpload(result.secure_url)
        } else {
          onGlbUpload(result.secure_url)
        }
        flashSuccess(`${type.toUpperCase()} model uploaded successfully! File: ${file.name}`, 5000)
      },
      failure: () => `Failed to upload ${type.toUpperCase()} file: ${file.name}. Please try again.`,
      onSettled: () => setUploadType(null),
    })
    // Reset file input
    event.target.value = ''
  }

  const handlePreview = (modelUrl: string, type: ArModelType) => {
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

  const removeFile = (type: ArModelType) => {
    if (type === 'usdz') {
      onUsdzUpload('')
    } else {
      onGlbUpload('')
    }
    flashSuccess(`${type.toUpperCase()} model removed successfully`, 3000)
  }

  const downloadFile = (url: string, type: ArModelType) => {
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
          {success && <SuccessNotice message={success} hint="Your AR experience is ready!" />}
          {error && <ErrorNotice message={error} />}
          {!isCloudinaryConfigured && <ConfigurationNotice feature="AR file" />}
          {isCloudinaryConfigured && <ArRequirements restaurantName={restaurantName} />}

          {/* Upload Sections - Only show when Cloudinary is configured */}
          {isCloudinaryConfigured ? (
            <div className="grid lg:grid-cols-2 gap-8">
              <ArModelSection
                type="usdz"
                url={currentUsdzUrl}
                uploading={isUploading && uploadType === 'usdz'}
                progress={uploadProgress}
                disabled={isUploading}
                onFileChange={(e) => handleFileUpload(e, 'usdz')}
                onPreview={(url) => handlePreview(url, 'usdz')}
                onDownload={(url) => downloadFile(url, 'usdz')}
                onRemove={() => removeFile('usdz')}
              />
              <ArModelSection
                type="glb"
                url={currentGlbUrl}
                uploading={isUploading && uploadType === 'glb'}
                progress={uploadProgress}
                disabled={isUploading}
                onFileChange={(e) => handleFileUpload(e, 'glb')}
                onPreview={(url) => handlePreview(url, 'glb')}
                onDownload={(url) => downloadFile(url, 'glb')}
                onRemove={() => removeFile('glb')}
              />
            </div>
          ) : (
            <ArUploadUnavailable />
          )}

          {(currentUsdzUrl || currentGlbUrl) && <ArReadyStatus hasUsdz={Boolean(currentUsdzUrl)} hasGlb={Boolean(currentGlbUrl)} />}
        </CardContent>
      </Card>
    </div>
  )
}
