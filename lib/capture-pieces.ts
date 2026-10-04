// lib/capture-pieces.ts
// How the browser sends a capture's files: each in pieces of 32 MB, on the file's signed address
// with `part` and `parts` added, which the engine joins once the last arrives
// (services/capture-engine/engine/service.py). A web request on Modal ends at 150 seconds, and a
// 4K video is often 600 MB or more on a restaurant's connection; a piece takes seconds, and one
// that fails is sent again alone.

/** The size of one piece: a few seconds on a slow upload, few enough requests on a fast one. */
export const PIECE_BYTES = 32 * 1024 ** 2

/** One piece of a file: where it goes, and which bytes of the file it carries (end excluded). */
export type Piece = { url: string; start: number; end: number }

/** The pieces a file of `size` bytes is sent in, in order; one piece for a small file. */
export function pieces(url: string, size: number, pieceBytes = PIECE_BYTES): Piece[] {
  const count = Math.max(1, Math.ceil(size / pieceBytes))
  return Array.from({ length: count }, (_, part) => {
    const address = new URL(url)
    address.searchParams.set('part', String(part))
    address.searchParams.set('parts', String(count))
    return { url: address.toString(), start: part * pieceBytes, end: Math.min(size, (part + 1) * pieceBytes) }
  })
}
