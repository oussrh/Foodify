#!/usr/bin/env node
// scripts/ci/e2e.mjs
// The browser suite's runner (`pnpm e2e`, and the gate's browser step): Playwright against the
// production build, on a database of its own. In CI the job has already migrated and seeded its
// Postgres service, so the suite runs as it is. Locally the database is E2E_DATABASE_URL when set,
// else the `e2e` database of the throwaway Docker container (scripts/ci/test-db.mjs), brought up
// to the migrations and seeded before every run — the seed only adds what is missing. The shared
// database `.env` names is the last resort, with a warning: the suite writes test accounts and
// orders, and a spec that reads a row someone last saved there fails for a reason that is not in
// the code (an opened Tuesday failed `hours.spec.ts` on 2026-09-23). Arguments pass through to
// Playwright: `pnpm e2e e2e/menu.spec.ts --project=phone`.
import { dockerDatabase, run } from './test-db.mjs'

const playwright = (env = {}) => run('pnpm', ['exec', 'playwright', 'test', ...process.argv.slice(2)], env).status ?? 1

if (process.env.CI) process.exit(playwright())

const url = process.env.E2E_DATABASE_URL || dockerDatabase('e2e', 'e2e')
if (!url) {
  console.warn('e2e: no Docker and no E2E_DATABASE_URL, so the suite runs on the database .env names. It will write test rows there.')
  process.exit(playwright())
}
const env = { DATABASE_URL: url, PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true' }
if (run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], env).status !== 0) process.exit(1)
if (run('pnpm', ['exec', 'prisma', 'db', 'seed'], env).status !== 0) process.exit(1)
process.exit(playwright(env))
