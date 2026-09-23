"use client"

import { uploadRestaurantCover, updateRestaurant } from '@/app/actions/restaurant-actions'
import { isBrowserUploadConfigured, uploadWithServerFallback } from '@/components/upload/browser-upload'
import { brandImageTarget } from '@/components/upload/targets'
import { validateBrandImage } from '@/components/upload/file-checks'
import { useUploadProgress } from '@/components/upload/use-upload-progress'
import { ConfigurationNotice, ErrorNotice, SuccessNotice } from '@/components/upload/status-notices'
import { DropZone, UploadProgress, UploadPrompt } from '@/components/upload/drop-zone'
import { UploadedActions } from '@/components/upload/uploaded-actions'
import { BrandImageCard, BrandImageHeader, BrandImageRequirements } from '@/components/upload/brand-image-parts'

interface RestaurantCoverUploadProps {
  restaurantId?: string
  restaurantSlug: string
  restaurantName: string
  currentCoverUrl?: string | undefined
  onCoverUpload: (url: string) => void
  disabled?: boolean
}

/**
 * Uploads, previews, downloads and removes a restaurant's cover image; with a `restaurantId` the
 * upload and the removal are saved at once, without one only the form hears of them.
 */
export default function RestaurantCoverUpload({
  restaurantId,
  restaurantSlug,
  restaurantName,
  currentCoverUrl,
  onCoverUpload,
  disabled = false
}: RestaurantCoverUploadProps) {
  const { isUploading, uploadProgress, error, success, setError, setSuccess, track } = useUploadProgress(300)

  // Check if Cloudinary is configured
  const isCloudinaryConfigured = isBrowserUploadConfigured()

  // Auto-save the cover URL to the database immediately (only if restaurant exists)
  const saveCover = async (coverUrl: string, fileName: string) => {
    console.log('Setting cover URL:', coverUrl)
    if (restaurantId) {
      try {
        await updateRestaurant(restaurantId, { coverImageUrl: coverUrl })
        console.log('Cover saved to database successfully')
        onCoverUpload(coverUrl)
        setSuccess(`Cover image uploaded and saved successfully! File: ${fileName}`)
      } catch (saveError) {
        console.error('Failed to save cover to database:', saveError)
        onCoverUpload(coverUrl)
        setSuccess(`Cover image uploaded successfully, but you may need to save the form manually. File: ${fileName}`)
      }
    } else {
      // For new restaurants, just update the form state
      onCoverUpload(coverUrl)
      setSuccess(`Cover image uploaded successfully! File: ${fileName}`)
    }
    setTimeout(() => setSuccess(null), 5000)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const problem = validateBrandImage(file, 10)
    if (problem) {
      setError(problem)
      event.target.value = ''
      return
    }

    await track({
      upload: () => uploadWithServerFallback(file, brandImageTarget(restaurantSlug, 'cover'), { action: uploadRestaurantCover, slug: restaurantSlug, urlKey: 'coverUrl' }),
      onUploaded: (url) => saveCover(url || '', file.name),
      failure: (err) => `Failed to upload cover image: ${file.name}. ${err instanceof Error ? err.message : 'Unknown error occurred'}`,
    })
    // Reset file input
    event.target.value = ''
  }

  const handlePreview = (coverUrl: string) => {
    window.open(coverUrl, '_blank')
  }

  const removeCover = () => {
    if (restaurantId) {
      // Auto-save the removal to database
      updateRestaurant(restaurantId, { coverImageUrl: '' })
        .then(() => {
          console.log('Cover removed from database successfully')
          onCoverUpload('')
          setSuccess('Cover image removed successfully')
        })
        .catch((error) => {
          console.error('Failed to remove cover from database:', error)
          onCoverUpload('')
          setSuccess('Cover image removed from form, but you may need to save manually')
        })
    } else {
      onCoverUpload('')
      setSuccess('Cover image removed successfully')
    }
    setTimeout(() => setSuccess(null), 3000)
  }

  const downloadCover = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${restaurantName.replace(/\s+/g, '_')}_cover`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isCloudinaryConfigured) {
    return (
      <div className="space-y-4">
        <ConfigurationNotice feature="cover image" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {success && <SuccessNotice message={success} hint="Your restaurant cover image is ready!" />}
      {error && <ErrorNotice message={error} />}

      {/* Cover Upload Section */}
      <div className="space-y-4">
        <BrandImageHeader kind="cover" />

        {currentCoverUrl ? (
          <div className="space-y-4">
            <BrandImageCard kind="cover" url={currentCoverUrl} restaurantName={restaurantName} />
            <UploadedActions
              onPreview={() => handlePreview(currentCoverUrl)}
              onDownload={() => downloadCover(currentCoverUrl)}
              onRemove={removeCover}
              disabled={disabled}
              removeDisabled={disabled || isUploading}
            />
          </div>
        ) : (
          <DropZone id="cover-upload" accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" onChange={handleFileUpload} disabled={disabled || isUploading} dimmed={disabled}>
            {isUploading ? (
              <UploadProgress label="Uploading cover image..." progress={uploadProgress} narrow />
            ) : (
              <UploadPrompt title="Upload restaurant cover image" hint="Supports: JPG, PNG, WebP, SVG (max 10MB)" />
            )}
          </DropZone>
        )}
      </div>

      <BrandImageRequirements kind="cover" restaurantSlug={restaurantSlug} />
    </div>
  )
}
