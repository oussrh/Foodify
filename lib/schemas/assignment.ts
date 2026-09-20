// lib/schemas/assignment.ts
// The two assignment routes (users of a restaurant, restaurants of a user): a UUID in the path,
// an array of UUIDs in the body under the field the route names.
import { z } from 'zod'
import { uuid } from './common'

export const assignment = (field: string) => z.object({ [field]: z.array(uuid) })

/** The request's JSON, or null when there is none or it does not parse: the schema refuses both alike. */
export const jsonBody = (req: Request): Promise<unknown> => req.json().catch(() => null)
