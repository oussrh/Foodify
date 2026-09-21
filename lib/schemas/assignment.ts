// lib/schemas/assignment.ts
// The two assignment routes (users of a restaurant, restaurants of a user): a UUID in the path,
// an array of UUIDs in the body under the field the route names.
import { z } from 'zod'
import { uuid } from './common'

/** The body under the named field, typed by that name so a route reads its array without a lookup that may miss. */
export const assignment = <F extends string>(field: F) => {
  const shape = { [field]: z.array(uuid) } as { [K in F]: z.ZodArray<typeof uuid> }
  return z.object(shape)
}

/** The request's JSON, or null when there is none or it does not parse: the schema refuses both alike. */
export const jsonBody = (req: Request): Promise<unknown> => req.json().catch(() => null)
