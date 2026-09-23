#!/usr/bin/env node
// scripts/ci/integration.mjs
// The integration suite's runner (`pnpm test:integration`): a test database, the migrations,
// then vitest on tests/integration/** (vitest.integration.config.ts). The database is
// TEST_DATABASE_URL when set (CI's Postgres service); otherwise the `test` database of the
// throwaway Docker container (scripts/ci/test-db.mjs). DATABASE_URL is never read: the
// developer's .env points at a database this suite must not touch.
import { dockerDatabase, run } from './test-db.mjs'

const url = process.env.TEST_DATABASE_URL || dockerDatabase('test', 'test:integration')
if (!url) {
  console.error('test:integration: no database. Set TEST_DATABASE_URL, or start Docker for a throwaway Postgres.')
  process.exit(1)
}
const env = { TEST_DATABASE_URL: url, DATABASE_URL: url, PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true' }
if (run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], env).status !== 0) process.exit(1)
process.exit(run('pnpm', ['exec', 'vitest', 'run', '-c', 'vitest.integration.config.ts'], env).status ?? 1)
