---
name: patterns-form-split-typing
description: Splitting a react-hook-form component: register/setValue/control do not narrow to a subset type, so pass registered props or type sub-components with the form's exact schema type
metadata:
  type: feedback
---

When a form section becomes a sub-component, do NOT type it `UseFormRegister<Subset>`: TypeScript refuses
`UseFormRegister<Big>` -> `UseFormRegister<Small>` (invariance through `validate(value, formValues)`),
`UseFormSetValue` and `Control` likewise. `FieldErrors<Big>` -> `FieldErrors<Small>` does narrow.

**Why:** on 2026-09-20 (phase 7, T2) a scratch `tsc` proved it; the pre-existing
`register as unknown as UseFormRegister<ContactFormValues>` in edit-restaurant-form is the cast this
trap produces, and abatty's `types.escapes` does not count it, so nobody noticed.
**How to apply:** two cast-free shapes. (1) Shared rows between two forms of different value types:
props are `UseFormRegisterReturn` + `FieldError` (`<Row field={register('price')} error={errors.price} />`),
the parent keeps the typed `register()` calls. (2) A section of ONE form: type it with that form's exact
values type; when the type lives in the form file (would cycle), move the local schema + type to a
`components/<form>/<name>-schema.ts` module and `export type { X } from` it in the form so page/lib
importers keep working. `useWatch({ control })` results are `Partial<Values>` for flat forms.
