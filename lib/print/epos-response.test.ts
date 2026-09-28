import { describe, expect, it } from 'vitest'
import { parseResults } from './epos-response'

const NS = 'xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"'

describe('parseResults', () => {
  it('reads each job of a Version 2.00 file under its id', () => {
    const file = `<?xml version="1.0" encoding="utf-8"?><PrintResponseInfo Version="2.00">
      <ePOSPrint><Parameter><devid>local_printer</devid><printjobid>J1</printjobid></Parameter><PrintResponse><response ${NS} success="true" code="" status="251854870" battery="0"/></PrintResponse></ePOSPrint>
      <ePOSPrint><Parameter><devid>local_printer</devid><printjobid>J2</printjobid></Parameter><PrintResponse><response ${NS} success="false" code="EPTR_REC_EMPTY" status="1"/></PrintResponse></ePOSPrint>
    </PrintResponseInfo>`
    expect(parseResults(file)).toEqual([
      { jobId: 'J1', success: true, code: '' },
      { jobId: 'J2', success: false, code: 'EPTR_REC_EMPTY' },
    ])
  })

  it('reads a Version 1.00 file as one result without an id', () => {
    const file = `<PrintResponseInfo Version="1.00"><response ${NS} success="true" code="" status="251854870" battery="0"/></PrintResponseInfo>`
    expect(parseResults(file)).toEqual([{ jobId: null, success: true, code: '' }])
  })

  it('tolerates the closing tags out of order, as in Epson’s own example', () => {
    const file = `<PrintResponseInfo Version="2.00"><ePOSPrint><Parameter><printjobid>J9</printjobid></ePOSPrint></Parameter><PrintResponse><response ${NS} success="true" code=""/></PrintResponse></PrintResponseInfo>`
    expect(parseResults(file)).toEqual([{ jobId: 'J9', success: true, code: '' }])
  })

  it('reads a result without a code as an empty code', () => {
    expect(parseResults(`<response ${NS} success="false"/>`)).toEqual([{ jobId: null, success: false, code: '' }])
  })

  it('finds nothing in a file with no result', () => {
    expect(parseResults('')).toEqual([])
    expect(parseResults('<PrintResponseInfo Version="2.00"></PrintResponseInfo>')).toEqual([])
  })
})
