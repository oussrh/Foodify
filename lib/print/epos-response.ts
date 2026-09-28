// lib/print/epos-response.ts
// What a printer says after a poll's jobs: the `ResponseFile` of its SetResponse, one result per
// job (Version 2.00: under the job's `printjobid`; Version 1.00: one bare result for the whole
// answer). Read with patterns rather than a parser because Epson's own examples are not always
// well-formed XML, and all that matters is the id, whether it printed, and the code.

/** One job's result: its id (null from a printer that answers without ids), whether it printed, Epson's code. */
export type EposResult = { jobId: string | null; success: boolean; code: string }

/** The value of `name="…"` in `tag`, or ''. */
function attribute(tag: string, name: string): string {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? ''
}

/** The result in one chunk of the file: its `<response …>` and the job id before it, if any. */
function resultOf(chunk: string): EposResult | null {
  const response = /<response\b[^>]*>/.exec(chunk)?.[0]
  if (!response) return null
  const jobId = /<printjobid>\s*([^<]*?)\s*<\/printjobid>/.exec(chunk)?.[1] ?? null
  return { jobId, success: attribute(response, 'success') === 'true', code: attribute(response, 'code') }
}

/** Every result in a SetResponse's `ResponseFile`, in the order written; none for a file that holds no result. */
export function parseResults(file: string): EposResult[] {
  const chunks = file.split(/<ePOSPrint\b/).slice(1)
  const results = (chunks.length > 0 ? chunks : [file]).map(resultOf)
  return results.filter((result): result is EposResult => result !== null)
}
