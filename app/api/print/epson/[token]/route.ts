// app/api/print/epson/[token]/route.ts
// Where an Epson kitchen printer asks for work (Server Direct Print, User's Manual M00062910). Its
// owner typed this address into it; the path's secret names the printer (server/print/token.ts),
// so there is no session. The printer posts a form: `ConnectionType=GetRequest` for its jobs,
// answered with ePOS-Print XML or an empty 200 when there is nothing; `SetResponse` with the
// result of the jobs it was handed, answered with an empty 200. Anything else it sends (status
// notifications) is acknowledged and not read. The body is bounded before it is parsed. A printer
// cannot read the JSON envelope, so its answers are `deviceAnswer` (lib/api.ts); failures are `fail`.
import { deviceAnswer, fail } from '@/lib/api'
import { parseResults } from '@/lib/print/epos-response'
import { printRequest } from '@/lib/print/epos-xml'
import { eposCall, printerToken } from '@/lib/schemas/print'
import { log } from '@/server/log'
import { printerByToken, recordResults, takeDueJobs } from '@/server/print/poll'
import { renderJobs } from '@/server/print/render-job'

/** The largest form read: a result file for a handful of jobs is a few kilobytes. */
const MAX_BODY = 256 * 1024

const XML = 'text/xml; charset=utf-8'

/** The empty 200 the printer expects when there is nothing more to say. */
const nothing = () => deviceAnswer(null, XML)

/** The printer's form, or null when it is too large or not the shape a printer sends. */
async function formOf(request: Request) {
  if (Number(request.headers.get('content-length') ?? '0') > MAX_BODY) return null
  const text = await request.text()
  if (text.length > MAX_BODY) return null
  const parsed = eposCall.safeParse(Object.fromEntries(new URLSearchParams(text)))
  return parsed.success ? parsed.data : null
}

/**
 * POST, an Epson printer only. An address whose secret is malformed or unknown is 404, the same
 * for both; a form over 256 KB or without a `ConnectionType` is 400. A poll answers 200 with the
 * printer's due jobs as ePOS-Print XML (Version 2.00, each with its id), or empty when there are
 * none; a result answers an empty 200 once recorded; anything else an empty 200. 500 internal.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = printerToken.safeParse((await params).token)
  if (!token.success) return fail('not_found', 'Unknown printer', 404)
  try {
    const now = new Date()
    const printer = await printerByToken(token.data, now)
    if (!printer) return fail('not_found', 'Unknown printer', 404)
    const form = await formOf(request)
    if (!form) return fail('invalid_payload', 'Not a Server Direct Print request', 400)
    if (form.ConnectionType === 'SetResponse') {
      await recordResults(printer.id, parseResults(form.ResponseFile ?? ''), now)
      return nothing()
    }
    if (form.ConnectionType !== 'GetRequest') return nothing()
    const ids = await takeDueJobs(printer.id, now)
    if (ids.length === 0) return nothing()
    return deviceAnswer(printRequest(await renderJobs(ids)), XML)
  } catch (error) {
    log.error({ err: error }, 'print: printer call failed')
    return fail('internal', 'Internal error', 500)
  }
}
