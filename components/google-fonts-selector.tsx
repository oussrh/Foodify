"use client"

import { useState, useEffect, useCallback, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Type, Search, Check } from 'lucide-react'
import { POPULAR_FONTS, getCategoryColor } from './google-fonts'
import FontPreviewCard from './font-preview-card'

interface GoogleFontsSelectorProps {
  currentFontUrl?: string
  onFontChange: (fontUrl: string, fontFamily: string) => void
  disabled?: boolean
}

export default function GoogleFontsSelector({ 
  currentFontUrl = '', 
  onFontChange, 
  disabled = false 
}: GoogleFontsSelectorProps) {
  const fontFromUrl = POPULAR_FONTS.find((font) => font.url === currentFontUrl)
  const ids = useId()
  const [pickedFont, setPickedFont] = useState<string | null>(null)
  const selectedFont = pickedFont ?? fontFromUrl?.name ?? ''
  const [previewText, setPreviewText] = useState('Your Restaurant Name')
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())

  const loadFont = useCallback((fontUrl: string, fontName: string) => {
    if (document.querySelector(`link[href="${fontUrl}"]`)) return
    const link = document.createElement('link')
    link.href = fontUrl
    link.rel = 'stylesheet'
    link.onload = () => setLoadedFonts((prev) => new Set(prev).add(fontName))
    document.head.appendChild(link)
  }, [])

  // The saved font is loaded for its preview.
  useEffect(() => {
    if (fontFromUrl) loadFont(fontFromUrl.url, fontFromUrl.name)
  }, [fontFromUrl, loadFont])

  const handleFontSelect = (fontName: string) => {
    const font = POPULAR_FONTS.find(f => f.name === fontName)
    if (font) {
      setPickedFont(fontName)
      loadFont(font.url, font.name)
      onFontChange(font.url, font.name)
    }
  }

  const handleCustomUrl = (url: string) => {
    // Basic validation for Google Fonts URL
    if (url.includes('fonts.googleapis.com')) {
      // Extract font family name from URL (simplified)
      const familyMatch = url.match(/family=([^&:]+)/)
      const fontFamily = familyMatch ? familyMatch[1].replace(/\+/g, ' ') : 'Custom Font'
      onFontChange(url, fontFamily)
    }
  }

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <div className="space-y-3">
        <Label htmlFor={`${ids}-font`} className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          Choose Google Font
        </Label>
        
        <Select onValueChange={handleFontSelect} value={selectedFont} disabled={disabled}>
          <SelectTrigger id={`${ids}-font`} className="border-border">
            <SelectValue placeholder="Select a font family" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {POPULAR_FONTS.map((font) => (
              <SelectItem key={font.name} value={font.name}>
                <div className="flex items-center justify-between w-full">
                  <span style={{ fontFamily: loadedFonts.has(font.name) ? font.name : 'inherit' }}>
                    {font.name}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded border ${getCategoryColor(font.category)}`}>
                    {font.category}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview Section */}
      {selectedFont && <FontPreviewCard selectedFont={selectedFont} previewText={previewText} onPreviewText={setPreviewText} />}

      {/* Custom URL Input */}
      <div className="space-y-3">
        <Label htmlFor={`${ids}-url`} className="text-sm font-medium text-muted-foreground">
          Or enter custom Google Fonts URL
        </Label>
        <div className="flex gap-2">
          <Input
            id={`${ids}-url`}
            placeholder="https://fonts.googleapis.com/css2?family=..."
            className="border-border font-mono text-sm"
            disabled={disabled}
            onChange={(e) => handleCustomUrl(e.target.value)}
          />
          <Button variant="outline" size="sm" disabled={disabled}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Visit <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">Google Fonts</a> to find more fonts and get the URL
        </p>
      </div>

      {/* Selected Font Info */}
      {selectedFont && (
        <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
          <Check className="h-4 w-4 text-success" />
          <span className="text-sm text-success">
            Font &ldquo;{selectedFont}&rdquo; will be applied to your restaurant page
          </span>
        </div>
      )}
    </div>
  )
}