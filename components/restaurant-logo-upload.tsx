"use client"

import { uploadRestaurantLogo, updateRestaurant } from '@/app/actions/restaurant-actions'
import { isBrowserUploadConfigured, uploadWithServerFallback } from '@/components/upload/browser-upload'
import { brandImageTarget } from '@/components/upload/targets'
import { validateBrandImage } from '@/components/upload/file-checks'
import { useUploadProgress } from '@/components/upload/use-upload-progress'
import { ConfigurationNotice, ErrorNotice, SuccessNotice } from '@/components/upload/status-notices'
import { DropZone, UploadProgress, UploadPrompt } from '@/components/upload/drop-zone'
import { UploadedActions } from '@/components/upload/uploaded-actions'
import { BrandImageCard, BrandImageHeader, BrandImageRequirements } from '@/components/upload/brand-image-parts'

interface RestaurantLogoUploadProps {
  restaurantId?: string
  restaurantSlug: string
  restaurantName: string
  currentLogoUrl?: string
  onLogoUpload: (url: string) => void
  disabled?: boolean
}

export default function RestaurantLogoUpload({
  restaurantId,
  restaurantSlug,
  restaurantName,
  currentLogoUrl,
  onLogoUpload,
  disabled = false
}: RestaurantLogoUploadProps) {
  const { isUploading, uploadProgress, error, success, setError, setSuccess, track } = useUploadProgress(300)

  // Check if Cloudinary is configured
  const isCloudinaryConfigured = isBrowserUploadConfigured()

  // Auto-save the logo URL to the database immediately (only if restaurant exists)
  const saveLogo = async (logoUrl: string, fileName: string) => {
    console.log('Setting logo URL:', logoUrl)
    if (restaurantId) {
      try {
        await updateRestaurant(restaurantId, { logoUrl })
        console.log('Logo saved to database successfully')
        onLogoUpload(logoUrl)
        setSuccess(`Logo uploaded and saved successfully! File: ${fileName}`)
      } catch (saveError) {
        console.error('Failed to save logo to database:', saveError)
        onLogoUpload(logoUrl)
        setSuccess(`Logo uploaded successfully, but you may need to save the form manually. File: ${fileName}`)
      }
    } else {
      // For new restaurants, just update the form state
      onLogoUpload(logoUrl)
      setSuccess(`Logo uploaded successfully! File: ${fileName}`)
    }
    setTimeout(() => setSuccess(null), 5000)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const problem = validateBrandImage(file, 5)
    if (problem) {
      setError(problem)
      event.target.value = ''
      return
    }

    await track({
      upload: () => uploadWithServerFallback(file, brandImageTarget(restaurantSlug, 'logo'), { action: uploadRestaurantLogo, slug: restaurantSlug, urlKey: 'logoUrl' }),
      onUploaded: (url) => saveLogo(url || '', file.name),
      failure: (err) => `Failed to upload logo: ${file.name}. ${err instanceof Error ? err.message : 'Unknown error occurred'}`,
    })
    // Reset file input
    event.target.value = ''
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
        <ConfigurationNotice feature="logo" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {success && <SuccessNotice message={success} hint="Your restaurant logo is ready!" />}
      {error && <ErrorNotice message={error} />}

      {/* Logo Upload Section */}
      <div className="space-y-4">
        <BrandImageHeader kind="logo" />

        {currentLogoUrl ? (
          <div className="space-y-4">
            <BrandImageCard kind="logo" url={currentLogoUrl} restaurantName={restaurantName} />
            <UploadedActions
              onPreview={() => handlePreview(currentLogoUrl)}
              onDownload={() => downloadLogo(currentLogoUrl)}
              onRemove={removeLogo}
              disabled={disabled}
              removeDisabled={disabled || isUploading}
            />
          </div>
        ) : (
          <DropZone id="logo-upload" accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" onChange={handleFileUpload} disabled={disabled || isUploading} dimmed={disabled}>
            {isUploading ? (
              <UploadProgress label="Uploading logo..." progress={uploadProgress} narrow />
            ) : (
              <UploadPrompt title="Upload restaurant logo" hint="Supports: JPG, PNG, WebP, SVG (max 5MB)" />
            )}
          </DropZone>
        )}
      </div>

      <BrandImageRequirements kind="logo" restaurantSlug={restaurantSlug} />
    </div>
  )
}
