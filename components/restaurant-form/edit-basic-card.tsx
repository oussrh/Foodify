// components/restaurant-form/edit-basic-card.tsx
// The "Basic Information" card of the settings form's General tab: the identity fields (name,
// slug, tagline, description, cuisine, price range) and the money and language fields
// (currency, its read-only symbol carried by hidden inputs, default language). Every change
// dirties the form.
'use client'

import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Globe, DollarSign, ChefHat, CreditCard } from 'lucide-react'
import { CURRENCIES, currencySymbolFor } from './currencies'
import type { EditRestaurantValues } from './edit-restaurant-schema'

type Props = {
  register: UseFormRegister<EditRestaurantValues>
  errors: FieldErrors<EditRestaurantValues>
  setValue: UseFormSetValue<EditRestaurantValues>
  defaultValues: EditRestaurantValues
  currencySymbol: string | undefined
}

function IdentityFields({ register, errors, setValue, defaultValues }: Omit<Props, 'currencySymbol'>) {
  return (
    <>
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
          <Select onValueChange={(value) => setValue('priceRange', value as "$" | "$$" | "$$$" | "$$$$", { shouldDirty: true })} {...(defaultValues.priceRange !== undefined ? { defaultValue: defaultValues.priceRange } : {})}>
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
    </>
  )
}

function LocaleFields({ register, setValue, defaultValues, currencySymbol }: Omit<Props, 'errors'>) {
  return (
    <>
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
            const newSymbol = currencySymbolFor(value);
            setValue("currencySymbol", newSymbol, { shouldDirty: true });
          }} defaultValue={defaultValues.currency || "USD"}>
            <SelectTrigger className="border-border">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencySymbol">Currency Symbol</Label>
          <Input
            id="currencySymbol"
            value={currencySymbol || ''}
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
    </>
  )
}

export default function EditBasicCard(props: Props) {
  return (
    <Card className="border-border">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <IdentityFields register={props.register} errors={props.errors} setValue={props.setValue} defaultValues={props.defaultValues} />
        <LocaleFields register={props.register} setValue={props.setValue} defaultValues={props.defaultValues} currencySymbol={props.currencySymbol} />
      </CardContent>
    </Card>
  )
}
