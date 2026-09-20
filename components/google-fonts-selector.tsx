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
import { Card } from '@/components/ui/card'
import { Type, Search, Eye, Check } from 'lucide-react'

interface GoogleFontsSelectorProps {
  currentFontUrl?: string
  onFontChange: (fontUrl: string, fontFamily: string) => void
  disabled?: boolean
}

// Popular Google Fonts for restaurants/businesses
const POPULAR_FONTS = [
  { name: 'Inter', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { name: 'Roboto', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap' },
  { name: 'Open Sans', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { name: 'Poppins', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { name: 'Lato', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { name: 'Montserrat', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { name: 'Nunito', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
  { name: 'Source Sans Pro', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap' },
  { name: 'Playfair Display', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap' },
  { name: 'Merriweather', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
  { name: 'Crimson Text', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap' },
  { name: 'Lora', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap' },
  { name: 'Dancing Script', category: 'handwriting', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap' },
  { name: 'Pacifico', category: 'handwriting', url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
  { name: 'Lobster', category: 'display', url: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap' },
  { name: 'Oswald', category: 'display', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap' }
]

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sans-serif': return 'bg-muted text-muted-foreground border-border'
      case 'serif': return 'bg-muted text-muted-foreground border-border'
      case 'handwriting': return 'bg-muted text-muted-foreground border-border'
      case 'display': return 'bg-muted text-warning border-border'
      default: return 'bg-muted text-muted-foreground border-border'
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
      {selectedFont && (
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
              onChange={(e) => setPreviewText(e.target.value)}
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
      )}

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