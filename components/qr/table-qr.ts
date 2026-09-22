// components/qr/table-qr.ts
// The per-table QR codes: one per table of the room, each opening the menu with its table
// number so the guest never types it (`?table=`, which the order form then shows read-only).
// The numbers are 1..count; a restaurant with `tableCount` 0 prints none.

/** The menu URL a table's QR code carries: the restaurant's menu, with the table in the query. */
export function tableMenuUrl(origin: string, slug: string, table: number | string): string {
  return `${origin}/restaurant/${slug}?table=${encodeURIComponent(String(table))}`
}

/** The tables of a room, 1..count, as the sheet prints them; empty for a restaurant that has not said how many it has. */
export function tableNumbers(count: number): number[] {
  if (!Number.isFinite(count) || count < 1) return []
  return Array.from({ length: Math.min(Math.trunc(count), 300) }, (_, i) => i + 1)
}

/** One CSV cell: quoted always, and an inner quote doubled, so a name with a comma survives. */
const cell = (value: string) => `"${value.replace(/"/g, '""')}"`

/**
 * The room as a spreadsheet: a header row, then one row per table with its link, RFC 4180 (CRLF
 * between rows, every field quoted). For a restaurant printing its own labels, or handing the
 * list to whoever does. A room with no tables set is the header alone, not an empty file.
 */
export function tablesCsv(restaurant: { name: string; slug: string }, origin: string, count: number): string {
  const rows = tableNumbers(count).map((table) => [restaurant.name, String(table), tableMenuUrl(origin, restaurant.slug, table)])
  return [['Restaurant', 'Table', 'Link'], ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
}
