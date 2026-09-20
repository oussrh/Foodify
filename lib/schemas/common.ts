// lib/schemas/common.ts
// The pieces every boundary schema is built from (VALID.1, VALID.2). A form validates with the
// same schema its server action parses, so a rule lives here once. Messages are English
// sentences for now: the dashboards have one language and no message catalogue; when one
// exists they become keys (docs/ADOPTION_DECISIONS.md, phase 4).
import { z } from 'zod'

/** Every row id is a v4 UUID (Prisma's `@default(uuid())`; verified over the live data on 2026-09-20). */
export const uuid = z.uuid()
export const email = z.email('Please enter a valid email address')
export const password = z.string().min(6, 'Password must be at least 6 characters')
export const bilingualName = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameFr: z.string().min(1, 'French name is required'),
})
