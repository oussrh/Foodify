"use client"

import { Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { POPULAR_FONTS, getCategoryColor } from './google-fonts'

interface FontPreviewCardProps {
  selectedFont: string
  /** The sample line the manager types; kept by the selector so it survives the card being hidden */
  previewText: string
  onPreviewText: (text: string) => void
}

/** The selected font on a name the manager types and two sample lines. */
export default function FontPreviewCard({ selectedFont, previewText, onPreviewText }: FontPreviewCardProps) {
  return (
    <Card className="p-4 border-border">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium leading-none">
            <Eye className="h-4 w-4" />
            Font Preview
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Current:</span>
            <span className={`px-2 py-1 text-xs rounded border ${getCategoryColor(POPULAR_FONTS.find(f => f.name === selectedFont)?.category || '')}`}>
              {selectedFont}
            </span>
          </div>
        </div>

        <Input
          placeholder="Type to preview font..."
          value={previewText}
          onChange={(e) => onPreviewText(e.target.value)}
          className="border-border"
        />

        <div className="space-y-3 p-4 bg-card rounded-lg border">
          <div
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: selectedFont }}
          >
            {previewText}
          </div>
          <div
            className="text-base text-muted-foreground"
            style={{ fontFamily: selectedFont }}
          >
            Welcome to our restaurant! Discover our delicious menu with AR experience.
          </div>
          <div
            className="text-sm text-muted-foreground"
            style={{ fontFamily: selectedFont }}
          >
            Perfect for headings, body text, and menu items.
          </div>
        </div>
      </div>
    </Card>
  )
}
