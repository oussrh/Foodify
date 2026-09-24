#!/usr/bin/env node
// `pnpm db:setup`: wipe the database, push the schema, seed it. `prisma db push --force-reset
// --accept-data-loss` drops every table of whatever DATABASE_URL names, and `.env` names the live
// database, so this refuses unless the host is this machine. A remote database is changed by
// migrations (`prisma migrate deploy`), never reset.
import 'dotenv/config'
import { run } from './ci/test-db.mjs'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

/** The host of a database URL when it is this machine, or null (a remote host, or no URL). */
export function localDatabaseHost(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, '').toLowerCase()
    return LOCAL_HOSTS.has(host) ? host : null
  } catch {
    return null
  }
}

/** A URL's host for a message, without the credentials. */
export function describeHost(url) {
  try {
    const u = new URL(url)
    return `${u.hostname}${u.pathname}`
  } catch {
    return 'an unreadable DATABASE_URL'
  }
}

if (process.argv[1]?.endsWith('db-setup.mjs')) {
  const url = process.env.DATABASE_URL
  if (!localDatabaseHost(url)) {
    console.error(
      `db:setup resets the database and deletes every row. DATABASE_URL names ${url ? describeHost(url) : 'nothing'}, which is not this machine, so nothing was run.\n` +
        'Point DATABASE_URL at a local database for this command (for example DATABASE_URL=postgresql://test:test@localhost:5499/test pnpm db:setup).',
    )
    process.exit(1)
  }
  for (const args of [['generate'], ['db', 'push', '--force-reset', '--accept-data-loss'], ['db', 'seed']]) {
    const status = run('pnpm', ['exec', 'prisma', ...args]).status
    if (status !== 0) process.exit(status ?? 1)
  }
}
