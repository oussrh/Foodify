'use client'

// The QR card's actions: copy the menu URL (with the execCommand fallback for older
// browsers), download the HD QR code as a file (fetched as a blob, or opened directly when
// the fetch fails), share the menu (Web Share API, or a copy when it is missing), and open
// the menu in a phone-sized window.
import { useCallback, useState } from 'react'
import { QR_SIZES, qrCodeUrl } from '@/components/qr/qr-urls'

const downloadName = (restaurantName: string) => `${restaurantName.replace(/\s+/g, '_')}_QR_Menu_HD.png`

/** Fallback for older browsers */
function copyViaTextArea(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

/** A click on a transient anchor: the browser saves `href` under `download`. */
function clickDownloadLink(href: string, download: string, target?: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = download
  if (target) link.target = target
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * The menu QR dialog's actions: copy the URL, download the 1200px code as a file, share the menu
 * (falling back to a copy) and open it in a phone-sized window.
 */
export function useQrActions(url: string, restaurantName: string) {
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const qrCodeDownloadUrl = qrCodeUrl(url, QR_SIZES.download)

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      copyViaTextArea(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [url])

  const downloadQRCode = useCallback(async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(qrCodeDownloadUrl)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      clickDownloadLink(downloadUrl, downloadName(restaurantName))
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback to direct link
      clickDownloadLink(qrCodeDownloadUrl, downloadName(restaurantName), '_blank')
    } finally {
      setIsDownloading(false)
    }
  }, [qrCodeDownloadUrl, restaurantName])

  const shareMenu = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName} - Digital Menu`,
          text: `Check out the digital menu for ${restaurantName} with AR experience!`,
          url: url,
        })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err)
          // Fallback to copying URL
          copyToClipboard()
        }
      }
    } else {
      // Fallback to copying URL
      copyToClipboard()
    }
  }, [url, restaurantName, copyToClipboard])

  const openMenuPreview = () => {
    window.open(url, '_blank', 'width=400,height=700,scrollbars=yes,resizable=yes')
  }

  return { copied, isDownloading, copyToClipboard, downloadQRCode, shareMenu, openMenuPreview }
}
