'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { updateRestaurant } from '@/app/actions/restaurant-actions'
import BrandingPanel from '@/components/branding/branding-panel'
import ContactPanel, { type ContactFormValues } from '@/components/contact/contact-panel'
import SaveBar, { type SaveStatus } from '@/components/forms/save-bar'
import { useSaveShortcuts } from '@/components/forms/use-save-shortcuts'
import { useUnsavedChangesWarning } from '@/components/forms/use-unsaved-changes-warning'
import { editRestaurantSchema as schema, type EditRestaurantValues } from '@/components/restaurant-form/edit-restaurant-schema'
import SettingsTabs, { TABS } from '@/components/restaurant-form/settings-tabs'
import { useSettingsTab } from '@/components/restaurant-form/use-settings-tab'
import { toBrandingValues, toContactValues } from '@/components/restaurant-form/panel-values'
import EditBasicCard from '@/components/restaurant-form/edit-basic-card'
import { RESTAURANT_FIELD_LABELS } from '@/components/restaurant-form/field-labels'
import { firstFieldError } from '@/components/forms/schema-check'
import type { UseFormRegister } from 'react-hook-form'

export type { EditRestaurantValues } from '@/components/restaurant-form/edit-restaurant-schema'

/**
 * The Settings form across its General, Contact and Branding tabs, saved as one; uploads persist on
 * their own without dirtying it, and a refused save switches to the tab holding the error. The
 * Integrations tab shows `integrations` (the POS panel), outside the form: it saves step by step.
 */
export default function EditRestaurantForm({
  id,
  defaultValues,
  integrations,
}: {
  id: string
  defaultValues: EditRestaurantValues
  integrations?: React.ReactNode
}) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const { activeTab, showTab } = useSettingsTab()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    control,
    reset,
    resetField,
  } = useForm<EditRestaurantValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  })

  const values = useWatch({ control })

  // Uploads are saved the moment they finish, so they update the baseline instead of dirtying the form.
  const onBrandingChange = useCallback(
    (field: 'logoUrl' | 'coverImageUrl' | 'coverImageStyle' | 'colorTheme' | 'fontFamily' | 'googleFontUrl' | 'menuTheme', value: string, opts?: { persisted?: boolean }) => {
      if (opts?.persisted) resetField(field, { defaultValue: value })
      else setValue(field, value as never, { shouldDirty: true })
    },
    [resetField, setValue],
  )

  const hasUnsavedChanges = isDirty

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
        coverImageStyle: data.coverImageStyle || undefined,
        website: data.website || undefined,
      }

      await updateRestaurant(id, cleanedData)

      setSaveStatus('saved')

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
  }, [id, reset, setSaveStatus])

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        reset(defaultValues)
        setSaveStatus('idle')
      }
    }
  }, [hasUnsavedChanges, reset, defaultValues])

  // Validation errors on a hidden tab would be invisible: switch to the first tab that has one,
  // and say in the save bar that nothing was saved. A field can also be a hidden input with no
  // message of its own, and a save that silently did nothing is how one of those went unseen: the
  // first refusal is also toasted by its label, whether or not its field has a line.
  const onInvalid = useCallback(
    (errs: Record<string, unknown>) => {
      setSaveStatus('error')
      const why = firstFieldError(errs, RESTAURANT_FIELD_LABELS)
      if (why) toast.error('Could not save the settings', { id: 'restaurant-save', description: why })
      const bad = new Set(Object.keys(errs))
      const tab = TABS.find((t) => t.fields.some((f) => bad.has(f)))
      if (tab) showTab(tab.key)
    },
    [showTab],
  )

  const submit = useCallback(() => {
    handleSubmit(onSubmit, onInvalid)()
  }, [handleSubmit, onSubmit, onInvalid])
  const submitForm = useSaveShortcuts({ hasUnsavedChanges, isSubmitting, submit, cancel: handleCancel })
  useUnsavedChangesWarning(hasUnsavedChanges)

  return (
    <div className="relative">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <SettingsTabs activeTab={activeTab} errors={errors} onSelect={showTab} slug={defaultValues.slug} />

      <div role="tabpanel" id="settings-panel-general" aria-labelledby="settings-tab-general" hidden={activeTab !== 'general'} className="space-y-6">
      {/* Basic Information Section */}
      <EditBasicCard register={register} errors={errors} setValue={setValue} defaultValues={defaultValues} currencySymbol={values.currencySymbol} dietaryOptions={values.dietaryOptions ?? []} orderingEnabled={values.orderingEnabled ?? false} tableCount={values.tableCount ?? 0} />
      </div>

      <div role="tabpanel" id="settings-panel-contact" aria-labelledby="settings-tab-contact" hidden={activeTab !== 'contact'} className="space-y-6">
      <ContactPanel
        register={register as unknown as UseFormRegister<ContactFormValues>}
        errors={errors}
        values={toContactValues(values)}
        onChange={(field, value) => {
          if (field === 'socialDisplay') setValue(field, value === 'text' ? 'text' : 'icons', { shouldDirty: true })
          else setValue(field, value, { shouldDirty: true })
        }}
        disabled={isSubmitting}
      />
      <input type="hidden" {...register('openingHours')} />
      <input type="hidden" {...register('socialMedia')} />
      <input type="hidden" {...register('socialDisplay')} />
      </div>

      <div role="tabpanel" id="settings-panel-branding" aria-labelledby="settings-tab-branding" hidden={activeTab !== 'branding'} className="space-y-6">
      <BrandingPanel
        restaurantId={id}
        restaurantSlug={defaultValues.slug}
        values={toBrandingValues(values)}
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
      <SaveBar saveStatus={saveStatus} hasUnsavedChanges={hasUnsavedChanges} isSubmitting={isSubmitting} onDiscard={handleCancel} onSave={submitForm} className="mt-6" />
    </form>
    <div role="tabpanel" id="settings-panel-integrations" aria-labelledby="settings-tab-integrations" hidden={activeTab !== 'integrations'} className="mt-6">
      {integrations}
    </div>
    </div>
  )
}
