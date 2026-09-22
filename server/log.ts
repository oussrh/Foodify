// server/log.ts
// The one writer of output from the server (OBS.1): pino, one JSON record per line on stdout,
// which Vercel and any log shipper index by field. Redaction happens here, by field path, and
// nowhere else: a call site never masks a value, it passes the record and the paths below
// decide. `no-console` at error on the server's paths (eslint.config.mjs) keeps this the only
// way out. No transport and no worker thread, and the destination is `sync: true`: pino's default
// stream hands each record to an asynchronous write that only the process's exit flushes, and a
// serverless instance frozen right after the response, or killed, never exits.
import pino, { type Logger } from 'pino'
import { publicEnv } from '@/lib/env'

// A field that is a secret wherever it sits: at the top of a record or one level under any key.
const SECRET_FIELDS = [
  'password', 'currentPassword', 'newPassword', 'passwordHash',
  'otp', 'emailOtpCode', 'totpSecret', 'token', 'passwordResetToken', 'emailChangeToken', 'emailVerifyToken',
  'authorization', 'cookie',
  'email', 'newEmail', 'phone', 'recipient',
  'apiKey', 'api_key', 'secret', 'signature',
  'DATABASE_URL', 'RESEND_API_KEY', 'BREVO_API_KEY', 'CLOUDINARY_API_SECRET', 'NEXTAUTH_SECRET', 'AUTH_SECRET',
]

/**
 * Field paths never written: credentials and second factors, the session, reset and change-email
 * tokens, the request headers that carry them, addresses and phone numbers (personal data in a
 * log is a leak waiting for a breach) and the environment's secrets should a record ever carry them. `code`
 * is redacted at the top and under `credentials` only: `err.code` (ECONNREFUSED) and an API code
 * are not secrets and a log needs them. A new secret is added here, not masked where it is logged.
 */
export const REDACTED_PATHS = [...SECRET_FIELDS.flatMap((field) => [field, `*.${field}`]), 'code', 'credentials.code']

/** What a redacted field reads as in a record; a value, never the field's absence, so a reader can tell a secret from a missing field. */
export const CENSOR = '<redacted>'

/** The level for an environment: nothing under a test runner, `info` and up in production, everything in development. */
export function levelFor(env: { isTest: boolean; isProduction: boolean }): 'silent' | 'info' | 'debug' {
  if (env.isTest) return 'silent'
  return env.isProduction ? 'info' : 'debug'
}

/**
 * A logger with the redaction above; `destination` is for a test that reads the records back,
 * the server writes to stdout synchronously (an asynchronous write is lost when the instance is
 * frozen or killed before the exit that flushes it). `err` is serialised as message, type and
 * stack; no pid or hostname, which mean nothing on a platform that starts an instance per burst.
 */
export function createLogger(destination?: pino.DestinationStream, level: string = levelFor(publicEnv)): Logger {
  const options: pino.LoggerOptions = {
    level,
    redact: { paths: REDACTED_PATHS, censor: CENSOR },
    serializers: { err: pino.stdSerializers.err },
    base: null,
  }
  return pino(options, destination ?? pino.destination({ fd: 1, sync: true }))
}

/** The server's logger; a module takes a child with its name (`log.child({ module: 'auth' })`) so a record says where it came from. */
export const log = createLogger()
