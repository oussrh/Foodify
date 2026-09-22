// components/shell/link-row.tsx
// One address, and the three things anybody ever wants to do with it: open it here, copy it, or
// send it to the device that needs it. Every one of these links is going to another device, where
// typing it by hand means a mistyped uuid, so the link is on screen to read as well.
'use client'

import { useState, type ReactNode } from 'react'
import { Copy, ExternalLink, Share2 } from 'lucide-react'
import { shareLink } from '@/components/menu/share-link'
import { Button } from '@/components/ui/button'

interface LinkRowProps {
  icon: ReactNode
  title: string
  description: string
  /** Absolute: it is read or tapped on a device that is not this one. */
  url: string
  /** What the share sheet offers — read by whoever receives it, not by the person sharing. */
  shareTitle: string
  shareText: string
}

/** An addressed destination with Open, Copy and Share; the caller supplies the card around it. */
export function LinkRow({ icon, title, description, url, shareTitle, shareText }: LinkRowProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // a browser without clipboard access: the link is on screen to copy by hand
    }
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm">
          {url}
        </code>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open
            </a>
          </Button>
          <Button variant="outline" onClick={copy}>
            <Copy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            onClick={() => shareLink({ title: shareTitle, text: shareText, url }, 'Link copied')}
            aria-label={`Share the ${title.toLowerCase()} link`}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
