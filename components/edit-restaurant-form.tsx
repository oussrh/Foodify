'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateRestaurant } from '@/app/actions/restaurant-actions'
import BrandingPanel from '@/components/branding/branding-panel'
import ContactPanel, { type ContactFormValues } from '@/components/contact/contact-panel'
import type { UseFormRegister } from 'react-hook-form'
import {
  Building2,
  Globe,
  DollarSign,
  ChefHat,
  CreditCard,
  Save,
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
  menuTheme: z.enum(['system', 'light', 'dark']).optional(),
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
    fields: ['logoUrl', 'colorTheme', 'coverImageUrl', 'coverImageStyle', 'fontFamily', 'googleFontUrl', 'menuTheme'],
  },
]

export default function EditRestaurantForm({
  id,
  defaultValues,
}: {
  id: string
  defaultValues: EditRestaurantValues
}) {
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
    reset,
    resetField,
  } = useForm<EditRestaurantValues>({ 
    resolver: zodResolver(schema), 
    defaultValues,
    mode: 'onChange'
  })

  const logoUrl = watch('logoUrl')
  const coverImageUrl = watch('coverImageUrl')
  const googleFontUrl = watch('googleFontUrl')
  const currentCurrencySymbol = watch('currencySymbol')

  // Uploads are saved the moment they finish, so they update the baseline instead of dirtying the form.
  const onBrandingChange = useCallback(
    (field: 'logoUrl' | 'coverImageUrl' | 'coverImageStyle' | 'colorTheme' | 'fontFamily' | 'googleFontUrl' | 'menuTheme', value: string, opts?: { persisted?: boolean }) => {
      if (opts?.persisted) resetField(field, { defaultValue: value })
      else setValue(field, value as never, { shouldDirty: true })
    },
    [resetField, setValue],
  )
  const brandingValues = {
    name: watch('name') || '',
    tagline: watch('tagline') || '',
    cuisineType: watch('cuisineType') || '',
    city: watch('city') || '',
    currencySymbol: currentCurrencySymbol || '',
    logoUrl: logoUrl || '',
    coverImageUrl: coverImageUrl || '',
    coverImageStyle: (watch('coverImageStyle') || 'cover') as 'cover' | 'repeat',
    colorTheme: watch('colorTheme') || '',
    fontFamily: watch('fontFamily') || '',
    googleFontUrl: googleFontUrl || '',
    menuTheme: (watch('menuTheme') || 'system') as 'system' | 'light' | 'dark',
  }
  
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
      
      await updateRestaurant(id, cleanedData)
      
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
      <ContactPanel
        register={register as unknown as UseFormRegister<ContactFormValues>}
        errors={errors}
        values={{
          name: watch('name') || '',
          email: watch('email'),
          phone: watch('phone'),
          website: watch('website'),
          streetAddress: watch('streetAddress'),
          city: watch('city'),
          state: watch('state'),
          postalCode: watch('postalCode'),
          country: watch('country'),
          openingHours: watch('openingHours'),
          socialMedia: watch('socialMedia'),
        }}
        onChange={(field, value) => setValue(field, value, { shouldDirty: true })}
        disabled={isSubmitting}
      />
      <input type="hidden" {...register('openingHours')} />
      <input type="hidden" {...register('socialMedia')} />
      </div>

      <div role="tabpanel" id="settings-panel-branding" aria-labelledby="settings-tab-branding" hidden={activeTab !== 'branding'} className="space-y-6">
      <BrandingPanel
        restaurantId={id}
        restaurantSlug={defaultValues.slug}
        values={brandingValues}
        onChange={onBrandingChange}
        disabled={isSubmitting}
      />
      {/* Registered so the values travel with the form submission */}
      <input type="hidden" {...register('logoUrl')} />
      <input type="hidden" {...register('coverImageUrl')} />
      <input type="hidden" {...register('coverImageStyle')} />
      <input type="hidden" {...register('colorTheme')} />
      <input type="hidden" {...register('fontFamily')} />
      <input type="hidden" {...register('googleFontUrl')} />
      <input type="hidden" {...register('menuTheme')} />
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
