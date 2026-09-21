// vitest.integration.config.ts
// The integration suite (TEST.2, DATA.3): tests/integration/** against a real Postgres, every
// test inside a transaction that is rolled back (tests/integration/db.ts). Run through
// `pnpm test:integration`, which provides the database (scripts/ci/integration.mjs); never
// through the unit config, which excludes this folder. No coverage: the unit suite holds the
// floors, this suite holds the constraints, the guards and the queries.
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    // One database, one connection pool: the files run one after the other.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
