import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The engine is stood in for by a fetch double: this is what we send it and how we read its
// answers. The engine's own side of the contract is tested in services/capture-engine
// (tests/service_test.py), against the same signing rule.
const { engine } = vi.hoisted(() => ({ engine: { current: null as { url: string; secret: string } | null } }))
vi.mock('@/lib/env', () => ({
  serverEnv: {
    get captureEngine() {
      return engine.current
    },
  },
}))

import { CaptureEngineError, engineFile, engineJobStatus, signedEngineUrl, startEngineJob } from './engine'

const SECRET = 's'.repeat(40)
const JOB = '0b3c6f1e-6a7d-4d2f-9a51-2f8e1c4b7a90'
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  engine.current = { url: 'http://localhost:8787', secret: SECRET }
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('signedEngineUrl', () => {
  it('signs the method, the path and the expiry with the shared secret, as the engine checks it', () => {
    const now = Date.UTC(2026, 9, 3, 12, 0, 0)
    const url = new URL(signedEngineUrl('PUT', `/jobs/${JOB}/source`, 7200, { name: 'still_1.jpg', now }))
    const exp = now / 1000 + 7200
    expect(url.origin + url.pathname).toBe(`http://localhost:8787/jobs/${JOB}/source`)
    expect(url.searchParams.get('name')).toBe('still_1.jpg')
    expect(url.searchParams.get('exp')).toBe(String(exp))
    const expected = crypto.createHmac('sha256', SECRET).update(`PUT /jobs/${JOB}/source still_1.jpg ${exp}`).digest('hex')
    expect(url.searchParams.get('sig')).toBe(expected)
  })

  it('signs a GET with no name, and never the same for another method, another file or another path', () => {
    const now = 0
    const sig = (u: string) => new URL(u).searchParams.get('sig')
    const get = signedEngineUrl('GET', '/jobs/x/files/dish.glb', 60, { now })
    expect(new URL(get).searchParams.has('name')).toBe(false)
    expect(sig(get)).toBe(crypto.createHmac('sha256', SECRET).update('GET /jobs/x/files/dish.glb  60').digest('hex'))
    const put = signedEngineUrl('PUT', '/jobs/x/source', 60, { name: 'capture.mp4', now })
    expect(put).not.toContain(SECRET)
    expect(sig(put)).not.toBe(sig(signedEngineUrl('GET', '/jobs/x/source', 60, { now })))
    expect(sig(put)).not.toBe(sig(signedEngineUrl('PUT', '/jobs/x/source', 60, { name: 'still_1.jpg', now })))
    expect(sig(put)).not.toBe(sig(signedEngineUrl('PUT', '/jobs/y/source', 60, { name: 'capture.mp4', now })))
  })

  it('expires an address the given number of seconds from now', () => {
    const before = Math.floor(Date.now() / 1000)
    const exp = Number(new URL(signedEngineUrl('GET', '/jobs/x/files/dish.glb', 3600)).searchParams.get('exp'))
    expect(exp - before).toBeGreaterThanOrEqual(3600)
    expect(exp - before).toBeLessThanOrEqual(3601)
  })

  it('refuses when the engine is not configured', () => {
    engine.current = null
    expect(() => signedEngineUrl('GET', '/jobs/x', 60)).toThrow(CaptureEngineError)
  })
})

describe('calls to the engine', () => {
  it('starts a job with its parameters as JSON, with the secret as a bearer token', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ state: 'queued' }), { status: 202 }))
    await startEngineJob(JOB, { plate_cm: 27, base_text: 'Chez Foodify' })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe(`http://localhost:8787/jobs/${JOB}/start`)
    expect(init).toMatchObject({ method: 'POST', body: '{"plate_cm":27,"base_text":"Chez Foodify"}' })
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` })
  })

  it("reads a job's state and report", async () => {
    fetchMock.mockResolvedValue(Response.json({ state: 'running', stage: 'dense', report: null }))
    expect(await engineJobStatus(JOB)).toEqual({ state: 'running', stage: 'dense', report: null })
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ Authorization: `Bearer ${SECRET}` })
  })

  it('reads an answer of another shape, or not JSON at all, as the engine misbehaving', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ state: 'teleported' }))
    await expect(engineJobStatus(JOB)).rejects.toThrow(new CaptureEngineError('The capture engine answered in a shape Foodify does not read'))
    fetchMock.mockResolvedValueOnce(new Response('<html>proxy error</html>'))
    await expect(engineJobStatus(JOB)).rejects.toBeInstanceOf(CaptureEngineError)
  })

  it("downloads a finished job's file whole", async () => {
    fetchMock.mockResolvedValue(new Response(new Uint8Array([103, 108, 84, 70])))
    expect(await engineFile(JOB, 'dish.glb')).toEqual(new Uint8Array([103, 108, 84, 70]))
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`http://localhost:8787/jobs/${JOB}/files/dish.glb`)
  })

  it('says which call the engine refused, and with what', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 409 }))
    await expect(startEngineJob(JOB, { plate_cm: 27 })).rejects.toThrow(`The capture engine answered 409 to POST /jobs/${JOB}/start`)
  })

  it('says the engine did not answer when it is down or too slow', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('timed out'), { name: 'TimeoutError' }))
    await expect(engineJobStatus(JOB)).rejects.toThrow('The capture engine did not answer (TimeoutError)')
    fetchMock.mockRejectedValue('not an Error')
    await expect(engineJobStatus(JOB)).rejects.toThrow('The capture engine did not answer (error)')
  })

  it('calls nothing when the engine is not configured', async () => {
    engine.current = null
    await expect(engineJobStatus(JOB)).rejects.toThrow('The capture engine is not configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
