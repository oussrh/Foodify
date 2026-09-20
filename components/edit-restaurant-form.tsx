'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
  website: z.string().optional().or(z.literal("")).refine((val) => !val || z.string().url().safeParse(val).success, "Invalid URL format"),
  description: z.string().optional(),
  cuisineType: z.string().optional(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional().or(z.literal("")).or(z.undefined()),
  openingHours: z.string().optional(),
  socialMedia: z.string().optional(),
  // Design fields
  coverImageUrl: z.string().optional().or(z.literal("")).refine((val) => !val || z.string().url().safeParse(val).success, "Invalid URL format"),
  coverImageStyle: z.enum(["cover", "repeat"]).optional().or(z.literal("")).or(z.undefined()),
  secondaryColor: z.string().optional().or(z.literal("")),
  fontFamily: z.string().optional(),
  googleFontUrl: z.string().optional(),
  // Business settings
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
})

export type EditRestaurantValues = z.infer<typeof schema>

type SettingsTab = 'general' | 'contact' | 'branding'

const TABS: { key: SettingsTab; label: string; fields: (keyof EditRestaurantValues)[] }[] = [
  {
    key: 'general',
    label: 'General',
    fields: ['name', 'slug', 'tagline', 'description', 'cuisineType', 'priceRange', 'currency', 'currencySymbol', 'defaultLocale'],
  },
  {
    key: 'contact',
    label: 'Contact & hours',
    fields: ['email', 'phone', 'website', 'streetAddress', 'city', 'state', 'postalCode', 'country', 'openingHours', 'socialMedia'],
  },
  {
    key: 'branding',
    label: 'Branding',
    fields: ['logoUrl', 'colorTheme', 'secondaryColor', 'coverImageUrl', 'coverImageStyle', 'fontFamily', 'googleFontUrl'],
  },
]

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Keep the active tab in the URL so a reload (or a shared link) lands on the same section.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t && TABS.some((tab) => tab.key === t)) setActiveTab(t as SettingsTab)
  }, [])
  const showTab = useCallback((tab: SettingsTab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState(window.history.state, '', url)
  }, [])
  
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
    setHasUnsavedChanges(isDirty)
  }, [isDirty])

  // Handle save
  const onSubmit = useCallback(async (data: EditRestaurantValues) => {
    try {
      setSaveStatus('saving')
      toast.loading('Saving restaurant settings...', { id: 'restaurant-save' })
      
      // Clean up empty values to prevent validation errors
      const cleanedData = {
        ...data,
        colorTheme: data.colorTheme || undefined,
        secondaryColor: data.secondaryColor || undefined,
        coverImageUrl: data.coverImageUrl || undefined,
        googleFontUrl: data.googleFontUrl || undefined,
        currency: data.currency || undefined,
        currencySymbol: data.currencySymbol || undefined,
        priceRange: data.priceRange || undefined,
        coverImageStyle: data.coverImageStyle || undefined,
        website: data.website || undefined,
      }
      
      const result = await updateRestaurant(id, cleanedData)
      
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      
      // Reset form state to mark as clean
      reset(data)
      
      toast.success('Restaurant settings saved successfully!', { 
        id: 'restaurant-save',
        description: 'All changes have been saved.'
      })
      
      // Show saved status briefly
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Restaurant update error:', error)
      setSaveStatus('error')
      
      toast.error('Failed to save restaurant settings', {
        id: 'restaurant-save',
        description: error instanceof Error ? error.message : 'Please try again.'
      })
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [id, reset, setSaveStatus, setHasUnsavedChanges])
  
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
  
  // Validation errors on a hidden tab would be invisible: switch to the first tab that has one.
  const onInvalid = useCallback(
    (errs: Record<string, unknown>) => {
      const bad = new Set(Object.keys(errs))
      const tab = TABS.find((t) => t.fields.some((f) => bad.has(f)))
      if (tab) showTab(tab.key)
    },
    [showTab],
  )

  // Create a submit function that's always up to date
  const submitForm = useCallback(() => {
    if (!hasUnsavedChanges) {
      toast.info('No changes to save')
      return
    }
    
    if (isSubmitting) {
      return
    }
    
    handleSubmit(onSubmit, onInvalid)()
  }, [handleSubmit, onSubmit, onInvalid, hasUnsavedChanges, isSubmitting])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        submitForm()
      }
      if (e.key === 'Escape') {
        handleCancel()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [submitForm, handleCancel])
  
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


  return (
    <div className="relative">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <div role="tablist" aria-label="Settings sections" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
        {TABS.map((tab) => {
          const hasError = tab.fields.some((field) => field in errors)
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`settings-tab-${tab.key}`}
              aria-selected={active}
              aria-controls={`settings-panel-${tab.key}`}
              onClick={() => showTab(tab.key)}
              className={cn(
                '-mb-px flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
                active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {hasError && <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-label="Has errors" />}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="settings-panel-general" aria-labelledby="settings-tab-general" hidden={activeTab !== 'general'} className="space-y-6">
      {/* Basic Information Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
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
                className="border-border"
              />
              {errors.name && (
                <span className="text-sm text-destructive">{errors.name.message}</span>
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
                className="font-mono border-border"
              />
              {errors.slug && (
                <span className="text-sm text-destructive">{errors.slug.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              {...register('tagline')}
              className="border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              className="border-border min-h-[100px]"
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
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </Label>
              <Select onValueChange={(value) => setValue('priceRange', value as "$" | "$$" | "$$$" | "$$$$", { shouldDirty: true })} defaultValue={defaultValues.priceRange}>
                <SelectTrigger className="border-border">
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
                setValue("currency", value, { shouldDirty: true });
                // Auto-set currency symbol based on selection
                const symbols: Record<string, string> = {
                  "USD": "$", "EUR": "€", "GBP": "£", "CAD": "C$", 
                  "JPY": "¥", "AUD": "A$", "CHF": "CHF", "CNY": "¥",
                  "INR": "₹", "BRL": "R$", "MXN": "$", "ZAR": "R"
                };
                const newSymbol = symbols[value] || value;
                setValue("currencySymbol", newSymbol, { shouldDirty: true });
              }} defaultValue={defaultValues.currency || "USD"}>
                <SelectTrigger className="border-border">
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
                className="border-border font-mono bg-muted cursor-not-allowed"
              />
              <span className="text-xs text-muted-foreground">
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
              <SelectTrigger className="border-border">
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
      </div>

      <div role="tabpanel" id="settings-panel-contact" aria-labelledby="settings-tab-contact" hidden={activeTab !== 'contact'} className="space-y-6">
      {/* Contact Information Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-success" />
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
                className="border-border"
              />
              {errors.email && (
                <span className="text-sm text-destructive">{errors.email.message}</span>
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
                className="border-border"
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
              className="border-border"
            />
            {errors.website && (
              <span className="text-sm text-destructive">{errors.website.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-warning" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              {...register('streetAddress')}
              className="border-border"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                {...register('state')}
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                className="border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country')}
              className="border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="openingHours">Opening Hours</Label>
            <Textarea
              id="openingHours"
              {...register('openingHours')}
              className="border-border min-h-[80px]"
            />
            <span className="text-xs text-muted-foreground">
              Enter your operating hours. Use line breaks for different days.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-muted-foreground" />
            Social Media
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="socialMedia">Social Media Links</Label>
            <Textarea
              id="socialMedia"
              {...register('socialMedia')}
              placeholder="Facebook: https://facebook.com/yourrestaurant&#10;Instagram: https://instagram.com/yourrestaurant&#10;Twitter: https://twitter.com/yourrestaurant"
              className="border-border min-h-[100px]"
            />
            <span className="text-xs text-muted-foreground">
              Enter your social media links, one per line with platform name.
            </span>
          </div>
        </CardContent>
      </Card>
      </div>

      <div role="tabpanel" id="settings-panel-branding" aria-labelledby="settings-tab-branding" hidden={activeTab !== 'branding'} className="space-y-6">
      {/* Branding & Design Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-muted-foreground" />
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
                  className="h-12 w-20 border-border"
                />
                <Input
                  type="text"
                  {...register('colorTheme')}
                  placeholder="#3B82F6"
                  className="flex-1 border-border font-mono"
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
                  className="h-12 w-20 border-border"
                />
                <Input
                  type="text"
                  {...register('secondaryColor')}
                  placeholder="#6B7280"
                  className="flex-1 border-border font-mono"
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
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Select background style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">
                  <div className="space-y-1">
                    <div className="font-medium">Cover (Recommended)</div>
                    <div className="text-xs text-muted-foreground">Image fills the entire background area</div>
                  </div>
                </SelectItem>
                <SelectItem value="repeat">
                  <div className="space-y-1">
                    <div className="font-medium">Repeat Pattern</div>
                    <div className="text-xs text-muted-foreground">Image repeats as a pattern/texture</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Hidden input to ensure coverImageStyle is included in form submission */}
            <input type="hidden" {...register('coverImageStyle')} />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Save bar: only when there is something to save */}
      {(hasUnsavedChanges || saveStatus === 'saving' || saveStatus === 'error') && (
        <div className="sticky bottom-[72px] z-40 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sheet md:bottom-4">
          <p className="text-sm text-muted-foreground">
            {saveStatus === 'error' ? 'Could not save. Check the fields and try again.' : saveStatus === 'saving' ? 'Saving…' : 'You have unsaved changes.'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
              Discard
            </Button>
            <Button type="button" onClick={submitForm} disabled={isSubmitting}>
              {saveStatus === 'saving' ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
    </div>
  )
}
