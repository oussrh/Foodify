'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateRestaurant } from '@/app/actions/restaurant-actions'
import RestaurantLogoUpload from '@/components/restaurant-logo-upload'
import RestaurantCoverUpload from '@/components/restaurant-cover-upload'
import GoogleFontsSelector from '@/components/google-fonts-selector'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Palette, 
  ImageIcon,
  Clock,
  DollarSign,
  ChefHat,
  Share2,
  Type,
  CreditCard,
  Monitor,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  colorTheme: z.string().optional().or(z.literal("")),
  defaultLocale: z.enum(['en', 'fr']),
  // Address fields
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  // Business info fields
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  description: z.string().optional(),
  cuisineType: z.string().optional(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  openingHours: z.string().optional(),
  socialMedia: z.string().optional(),
  // Design fields
  coverImageUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  coverImageStyle: z.enum(["cover", "repeat"]).optional(),
  secondaryColor: z.string().optional().or(z.literal("")),
  fontFamily: z.string().optional(),
  googleFontUrl: z.string().optional(),
  // Business settings
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
})

export type EditRestaurantValues = z.infer<typeof schema>

export default function EditRestaurantForm({
  id,
  defaultValues,
}: {
  id: string
  defaultValues: EditRestaurantValues
}) {
  const router = useRouter()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
    reset
  } = useForm<EditRestaurantValues>({ 
    resolver: zodResolver(schema), 
    defaultValues,
    mode: 'onChange'
  })

  const logoUrl = watch('logoUrl')
  const coverImageUrl = watch('coverImageUrl')
  const googleFontUrl = watch('googleFontUrl')
  const currentCurrency = watch('currency')
  const currentCurrencySymbol = watch('currencySymbol')
  
  // Track form changes
  useEffect(() => {
    console.log('Form dirty state changed:', isDirty)
    setHasUnsavedChanges(isDirty)
  }, [isDirty])
  
  // Debug form values
  const formValues = watch()
  useEffect(() => {
    console.log('Form values changed:', formValues)
  }, [formValues])

  // Handle save
  const onSubmit = async (data: EditRestaurantValues) => {
    try {
      console.log('=== FORM SUBMISSION STARTED ===')
      console.log('Form data being submitted:', data)
      setSaveStatus('saving')
      
      // Clean up empty color values to prevent validation errors
      const cleanedData = {
        ...data,
        colorTheme: data.colorTheme || undefined,
        secondaryColor: data.secondaryColor || undefined,
        coverImageUrl: data.coverImageUrl || undefined,
        googleFontUrl: data.googleFontUrl || undefined,
        currency: data.currency || undefined,
        currencySymbol: data.currencySymbol || undefined,
      }
      
      console.log('Cleaned form data:', cleanedData)
      
      const result = await updateRestaurant(id, cleanedData)
      console.log('Restaurant update result:', result)
      
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      
      // Reset form state to mark as clean
      reset(data)
      
      console.log('=== FORM SUBMISSION COMPLETED ===')
      
      // Show saved status briefly
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('=== FORM SUBMISSION FAILED ===', error)
      console.error('Error details:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }
  
  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        reset(defaultValues)
        setHasUnsavedChanges(false)
        setSaveStatus('idle')
      }
    }
  }, [hasUnsavedChanges, reset, defaultValues])
  
  // Create a ref to the submit function
  const submitForm = useCallback(() => {
    handleSubmit(onSubmit)()
  }, [handleSubmit, onSubmit])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        console.log('Ctrl+S pressed, hasUnsavedChanges:', hasUnsavedChanges, 'isSubmitting:', isSubmitting)
        if (hasUnsavedChanges && !isSubmitting) {
          console.log('Triggering form submit...')
          submitForm()
        }
      }
      if (e.key === 'Escape') {
        handleCancel()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, isSubmitting, handleCancel, submitForm])
  
  // Warn about unsaved changes on page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Test input change handler
  const handleInputChange = (fieldName: string) => (e: any) => {
    const value = e.target.value
    console.log(`Field ${fieldName} changed to:`, value)
    setValue(fieldName as any, value, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="relative">
      {/* Debug panel - temporary */}
      <div className="fixed top-4 left-4 z-50 p-3 bg-blue-900 text-white text-xs rounded max-w-sm">
        <div>isDirty: {isDirty.toString()}</div>
        <div>hasUnsavedChanges: {hasUnsavedChanges.toString()}</div>
        <div>isSubmitting: {isSubmitting.toString()}</div>
        <div>saveStatus: {saveStatus}</div>
        <div>Current name: {watch('name')}</div>
        <button 
          onClick={() => {
            console.log('Manual trigger - setting name field')
            setValue('name', 'Test Restaurant ' + Date.now(), { shouldDirty: true })
          }}
          className="mt-2 px-2 py-1 bg-green-600 text-white rounded text-xs"
        >
          Test Change
        </button>
      </div>
      
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information Section */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Restaurant Name *
              </Label>
              <Input
                id="name"
                {...register('name')}
                className="border-gray-300"
              />
              {errors.name && (
                <span className="text-sm text-red-500">{errors.name.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                URL Slug *
              </Label>
              <Input
                id="slug"
                {...register('slug')}
                className="font-mono border-gray-300"
              />
              {errors.slug && (
                <span className="text-sm text-red-500">{errors.slug.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              {...register('tagline')}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              className="border-gray-300 min-h-[100px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cuisineType" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Cuisine Type
              </Label>
              <Input
                id="cuisineType"
                {...register('cuisineType')}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </Label>
              <Select onValueChange={(value) => setValue('priceRange', value as "$" | "$$" | "$$$" | "$$$$", { shouldDirty: true })} defaultValue={defaultValues.priceRange}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ - Budget Friendly</SelectItem>
                  <SelectItem value="$$">$$ - Moderate</SelectItem>
                  <SelectItem value="$$$">$$$ - Upscale</SelectItem>
                  <SelectItem value="$$$$">$$$$ - Fine Dining</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Currency
              </Label>
              <Select onValueChange={(value) => {
                console.log('Currency changed to:', value)
                setValue("currency", value, { shouldDirty: true });
                // Auto-set currency symbol based on selection
                const symbols: Record<string, string> = {
                  "USD": "$", "EUR": "€", "GBP": "£", "CAD": "C$", 
                  "JPY": "¥", "AUD": "A$", "CHF": "CHF", "CNY": "¥",
                  "INR": "₹", "BRL": "R$", "MXN": "$", "ZAR": "R"
                };
                const newSymbol = symbols[value] || value;
                console.log('Setting currency symbol to:', newSymbol)
                setValue("currencySymbol", newSymbol, { shouldDirty: true });
              }} defaultValue={defaultValues.currency || "USD"}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                  <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                  <SelectItem value="CHF">🇨🇭 CHF - Swiss Franc</SelectItem>
                  <SelectItem value="CNY">🇨🇳 CNY - Chinese Yuan</SelectItem>
                  <SelectItem value="INR">🇮🇳 INR - Indian Rupee</SelectItem>
                  <SelectItem value="BRL">🇧🇷 BRL - Brazilian Real</SelectItem>
                  <SelectItem value="MXN">🇲🇽 MXN - Mexican Peso</SelectItem>
                  <SelectItem value="ZAR">🇿🇦 ZAR - South African Rand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencySymbol">Currency Symbol</Label>
              <Input
                id="currencySymbol"
                value={currentCurrencySymbol || ''}
                readOnly
                placeholder="$"
                className="border-gray-300 font-mono bg-gray-50 cursor-not-allowed"
              />
              <span className="text-xs text-gray-500">
                Automatically set based on selected currency
              </span>
            </div>
            {/* Hidden inputs to ensure currency data is included in form submission */}
            <input type="hidden" {...register('currency')} />
            <input type="hidden" {...register('currencySymbol')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultLocale">Default Language</Label>
            <Select onValueChange={(value) => setValue('defaultLocale', value as 'en' | 'fr', { shouldDirty: true })} defaultValue={defaultValues.defaultLocale}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-green-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="border-gray-300"
              />
              {errors.email && (
                <span className="text-sm text-red-500">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                className="border-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              {...register('website')}
              className="border-gray-300"
            />
            {errors.website && (
              <span className="text-sm text-red-500">{errors.website.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Section */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-orange-600" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              {...register('streetAddress')}
              className="border-gray-300"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                {...register('state')}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                className="border-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country')}
              className="border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours Section */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-purple-600" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="openingHours">Opening Hours</Label>
            <Textarea
              id="openingHours"
              {...register('openingHours')}
              className="border-gray-300 min-h-[80px]"
            />
            <span className="text-xs text-gray-500">
              Enter your operating hours. Use line breaks for different days.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Branding & Design Section */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-indigo-600" />
            Branding & Design
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Logo Upload */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Restaurant Logo
            </Label>
            <RestaurantLogoUpload
              restaurantId={id}
              restaurantSlug={defaultValues.slug}
              restaurantName={defaultValues.name}
              currentLogoUrl={logoUrl}
              onLogoUpload={(url) => setValue('logoUrl', url, { shouldDirty: true })}
              disabled={isSubmitting}
            />
            {/* Hidden input to ensure logoUrl is included in form submission */}
            <input type="hidden" {...register('logoUrl')} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="colorTheme" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Primary Brand Color
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="colorTheme"
                  type="color"
                  value={watch('colorTheme') || '#3B82F6'}
                  onChange={(e) => setValue('colorTheme', e.target.value, { shouldDirty: true })}
                  className="h-12 w-20 border-gray-300"
                />
                <Input
                  type="text"
                  {...register('colorTheme')}
                  placeholder="#3B82F6"
                  className="flex-1 border-gray-300 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={watch('secondaryColor') || '#6B7280'}
                  onChange={(e) => setValue('secondaryColor', e.target.value, { shouldDirty: true })}
                  className="h-12 w-20 border-gray-300"
                />
                <Input
                  type="text"
                  {...register('secondaryColor')}
                  placeholder="#6B7280"
                  className="flex-1 border-gray-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Restaurant Cover Image
            </Label>
            <RestaurantCoverUpload
              restaurantId={id}
              restaurantSlug={defaultValues.slug}
              restaurantName={defaultValues.name}
              currentCoverUrl={coverImageUrl}
              onCoverUpload={(url) => setValue('coverImageUrl', url, { shouldDirty: true })}
              disabled={isSubmitting}
            />
            {/* Hidden input to ensure coverImageUrl is included in form submission */}
            <input type="hidden" {...register('coverImageUrl')} />
          </div>

          {/* Google Fonts Selection */}
          <div className="space-y-4">
            <GoogleFontsSelector
              currentFontUrl={googleFontUrl || defaultValues.googleFontUrl}
              onFontChange={(fontUrl, fontFamily) => {
                setValue("googleFontUrl", fontUrl, { shouldDirty: true });
                setValue("fontFamily", fontFamily, { shouldDirty: true });
              }}
              disabled={isSubmitting}
            />
            {/* Hidden inputs to ensure font data is included in form submission */}
            <input type="hidden" {...register('googleFontUrl')} />
            <input type="hidden" {...register('fontFamily')} />
          </div>

          {/* Cover Image Style */}
          <div className="space-y-2">
            <Label htmlFor="coverImageStyle" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Cover Image Background Style
            </Label>
            <Select onValueChange={(value) => setValue("coverImageStyle", value as "cover" | "repeat", { shouldDirty: true })} defaultValue={defaultValues.coverImageStyle || "cover"}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Select background style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">
                  <div className="space-y-1">
                    <div className="font-medium">Cover (Recommended)</div>
                    <div className="text-xs text-gray-500">Image fills the entire background area</div>
                  </div>
                </SelectItem>
                <SelectItem value="repeat">
                  <div className="space-y-1">
                    <div className="font-medium">Repeat Pattern</div>
                    <div className="text-xs text-gray-500">Image repeats as a pattern/texture</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Hidden input to ensure coverImageStyle is included in form submission */}
            <input type="hidden" {...register('coverImageStyle')} />
          </div>
        </CardContent>
      </Card>

      {/* Social Media Section */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-pink-600" />
            Social Media
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="socialMedia">Social Media Links</Label>
            <Textarea
              id="socialMedia"
              {...register('socialMedia')}
              className="border-gray-300 min-h-[100px]"
            />
            <span className="text-xs text-gray-500">
              Enter your social media links, one per line with platform name.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Buttons - Always visible */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-3 transition-all duration-300">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleCancel}
          disabled={!hasUnsavedChanges}
          className={`shadow-2xl border-2 bg-white transition-all duration-200 min-w-[120px] ${
            hasUnsavedChanges 
              ? 'border-red-300 hover:border-red-400 hover:bg-red-50 text-red-700' 
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isSubmitting || !hasUnsavedChanges}
          onClick={async () => {
            console.log('=== SAVE BUTTON CLICKED ===')
            console.log('Current form state:')
            console.log('- isDirty:', isDirty)
            console.log('- hasUnsavedChanges:', hasUnsavedChanges)
            console.log('- isSubmitting:', isSubmitting)
            console.log('- Current form values:', watch())
            
            if (!hasUnsavedChanges) {
              console.log('No unsaved changes detected!')
              return
            }
            
            console.log('Triggering form submission...')
            await handleSubmit(onSubmit)()
          }}
          className={`shadow-2xl transition-all duration-200 border-0 min-w-[140px] ${
            hasUnsavedChanges
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white scale-105 hover:scale-110'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed scale-100'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Try Again
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
            </>
          )}
        </Button>
      </div>
      
      {/* Status indicator */}
      <div className="fixed top-12 right-4 z-40">
        {hasUnsavedChanges ? (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 shadow-lg">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unsaved changes
            <kbd className="ml-2 px-1 py-0.5 text-xs bg-yellow-100 rounded">Ctrl+S</kbd>
          </Badge>
        ) : saveStatus === 'saved' ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 shadow-lg">
            <CheckCircle className="h-3 w-3 mr-1" />
            All changes saved
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300 shadow-lg">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready to edit
          </Badge>
        )}
      </div>
    </form>
    </div>
  )
}
