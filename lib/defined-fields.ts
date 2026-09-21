// lib/defined-fields.ts
// A parsed input at the database boundary. Zod's `.optional()` types a member as `T | undefined`,
// and a form hands the action the key with `undefined` in it; Prisma's inputs take an absent
// member but, under exactOptionalPropertyTypes, not an explicit `undefined`. Dropping those
// members says in the type what Prisma does at runtime (an undefined member is not written).

/** `T` with every member that may be `undefined` made optional and definite, the others as they are. */
export type DefinedFields<T> = { [K in keyof T as undefined extends T[K] ? never : K]: T[K] } & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>
}

/** The object without its `undefined` members; `null` stays, the input is not touched. */
export function definedFields<T extends object>(obj: T): DefinedFields<T> {
  // fromEntries answers Record<string, unknown>; the filter is the whole proof, so the cast states it
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as DefinedFields<T>
}
