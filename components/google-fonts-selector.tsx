"use client"

import { useState, useEffect } from 'react'
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
  const [selectedFont, setSelectedFont] = useState('')
  const [previewText, setPreviewText] = useState('Your Restaurant Name')
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())

  // Find current font from URL
  useEffect(() => {
    if (currentFontUrl) {
      const found = POPULAR_FONTS.find(font => font.url === currentFontUrl)
      if (found) {
        setSelectedFont(found.name)
        loadFont(found.url, found.name)
      }
    }
  }, [currentFontUrl])

  const loadFont = (fontUrl: string, fontName: string) => {
    if (loadedFonts.has(fontName)) return

    const link = document.createElement('link')
    link.href = fontUrl
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    
    setLoadedFonts(prev => new Set([...prev, fontName]))
  }

  const handleFontSelect = (fontName: string) => {
    const font = POPULAR_FONTS.find(f => f.name === fontName)
    if (font) {
      setSelectedFont(fontName)
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
      case 'sans-serif': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'serif': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'handwriting': return 'bg-pink-50 text-pink-700 border-pink-200'
      case 'display': return 'bg-orange-50 text-orange-700 border-orange-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          Choose Google Font
        </Label>
        
        <Select onValueChange={handleFontSelect} value={selectedFont} disabled={disabled}>
          <SelectTrigger className="border-gray-300">
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
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4" />
                Font Preview
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Current:</span>
                <span className={`px-2 py-1 text-xs rounded border ${getCategoryColor(POPULAR_FONTS.find(f => f.name === selectedFont)?.category || '')}`}>
                  {selectedFont}
                </span>
              </div>
            </div>
            
            <Input
              placeholder="Type to preview font..."
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="border-gray-300"
            />
            
            <div className="space-y-3 p-4 bg-white rounded-lg border">
              <div 
                className="text-2xl font-semibold text-gray-900"
                style={{ fontFamily: selectedFont }}
              >
                {previewText}
              </div>
              <div 
                className="text-base text-gray-700"
                style={{ fontFamily: selectedFont }}
              >
                Welcome to our restaurant! Discover our delicious menu with AR experience.
              </div>
              <div 
                className="text-sm text-gray-600"
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
        <Label className="text-sm font-medium text-gray-700">
          Or enter custom Google Fonts URL
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://fonts.googleapis.com/css2?family=..."
            className="border-gray-300 font-mono text-sm"
            disabled={disabled}
            onChange={(e) => handleCustomUrl(e.target.value)}
          />
          <Button variant="outline" size="sm" disabled={disabled}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Visit <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Fonts</a> to find more fonts and get the URL
        </p>
      </div>

      {/* Selected Font Info */}
      {selectedFont && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            Font "{selectedFont}" will be applied to your restaurant page
          </span>
        </div>
      )}
    </div>
  )
}