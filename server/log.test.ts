import { describe, expect, it } from 'vitest'
import { CENSOR, REDACTED_PATHS, createLogger, levelFor } from './log'

// A destination that keeps the records: pino writes one JSON line per call, synchronously.
function capture() {
  const records: Record<string, unknown>[] = []
  const logger = createLogger({ write: (line: string) => void records.push(JSON.parse(line)) }, 'debug')
  const last = () => records[records.length - 1] ?? {}
  return { logger, records, last }
}

describe('the logger', () => {
  it('writes one record per call with the level, the message and the fields', () => {
    const { logger, records, last } = capture()
    logger.info({ dishId: 'd1', arViewed: true }, 'dish view recorded')
    expect(records).toHaveLength(1)
    expect(last()).toMatchObject({ level: 30, msg: 'dish view recorded', dishId: 'd1', arViewed: true })
  })

  it('carries no pid or hostname', () => {
    const { logger, last } = capture()
    logger.info('boot')
    expect(last()).not.toHaveProperty('pid')
    expect(last()).not.toHaveProperty('hostname')
  })

  it('redacts a credential, a token and an address at the top of a record', () => {
    const { logger, last } = capture()
    logger.warn({ email: 'a@b.c', password: 'hunter2', emailVerifyToken: 'abc' }, 'sign-in refused')
    expect(last()).toMatchObject({ email: CENSOR, password: CENSOR, emailVerifyToken: CENSOR })
  })

  it('redacts the same fields one level under any key', () => {
    const { logger, last } = capture()
    logger.warn({ user: { email: 'a@b.c', totpSecret: 'JBSW' } }, 'sign-in refused')
    expect(last()).toMatchObject({ user: { email: CENSOR, totpSecret: CENSOR } })
  })

  it('keeps the fields beside a redacted one', () => {
    const { logger, last } = capture()
    logger.warn({ password: 'hunter2', user: { totpSecret: 'JBSW', role: 'SUPER_ADMIN' }, restaurantId: 'r1' }, 'sign-in refused')
    expect(last()).toMatchObject({ user: { role: 'SUPER_ADMIN' }, restaurantId: 'r1' })
  })

  it('keeps an error readable (message, type, code, stack) while the one-time code and the credentials are not', () => {
    const { logger, last } = capture()
    const err = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })
    logger.error({ err, code: '123456', credentials: { code: '123456', password: 'x' } }, 'authorize failed')
    const record = last() as { err: Record<string, unknown>; code: string; credentials: Record<string, string> }
    expect(record.err).toMatchObject({ type: 'Error', message: 'connect ECONNREFUSED', code: 'ECONNREFUSED' })
    expect(record.err.stack).toContain('connect ECONNREFUSED')
    expect(record.code).toBe(CENSOR)
    expect(record.credentials).toEqual({ code: CENSOR, password: CENSOR })
  })

  it('names every secret field at the top and under any key, and the environment secrets by name', () => {
    for (const field of ['password', 'passwordHash', 'token', 'authorization', 'cookie', 'email', 'secret', 'signature', 'DATABASE_URL', 'RESEND_API_KEY', 'CLOUDINARY_API_SECRET']) {
      expect(REDACTED_PATHS).toContain(field)
      expect(REDACTED_PATHS).toContain(`*.${field}`)
    }
  })

  it('is silent under a test runner, whatever else the environment says', () => {
    expect(levelFor({ isTest: true, isProduction: true })).toBe('silent')
  })

  it('is info and up in production', () => {
    expect(levelFor({ isTest: false, isProduction: true })).toBe('info')
  })

  it('is everything in development', () => {
    expect(levelFor({ isTest: false, isProduction: false })).toBe('debug')
  })

  it('writes nothing at the silent level', () => {
    const records: unknown[] = []
    createLogger({ write: (line: string) => void records.push(line) }, levelFor({ isTest: true, isProduction: false })).error('nothing')
    expect(records).toEqual([])
  })
})
