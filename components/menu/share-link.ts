import { toast } from 'sonner'

interface ShareLinkData {
  title: string
  text?: string
  url: string
}

/**
 * The native share sheet where the browser has one; elsewhere the link goes to the clipboard
 * and a toast says so. A share sheet the guest cancels is not an error.
 */
export async function shareLink(data: ShareLinkData, copiedMessage: string) {
  try {
    if (navigator.share) await navigator.share(data)
    else {
      await navigator.clipboard.writeText(data.url)
      toast.success(copiedMessage)
    }
  } catch {
    // cancelled
  }
}
