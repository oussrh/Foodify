// lib/slug.ts
/** A restaurant slug from a name: lowercase ASCII letters, digits and single hyphens, the rule lib/schemas/restaurant.ts holds a typed slug to. */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
