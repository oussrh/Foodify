#!/usr/bin/env node
// scripts/ci/integration.mjs
// The integration suite's runner (`pnpm test:integration`): a test database, the migrations,
// then vitest on tests/integration/** (vitest.integration.config.ts). The database is
// TEST_DATABASE_URL when set (CI's Postgres service); otherwise a throwaway Docker container on
// port 5499 that is left running for the next run. DATABASE_URL is never read: the developer's
// .env points at a database this suite must not touch.
import { spawnSync } from 'node:child_process'

const CONTAINER = 'foodify-test-db'
const PORT = 5499
const LOCAL_URL = `postgresql://test:test@localhost:${PORT}/test`

const run = (cmd, args, env = {}) => spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } })
const quiet = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' })
// What docker said when it refused, so a pull failure or a taken port is not read as "no Docker".
const said = (r) => (r.stderr || r.stdout || '').trim()

function dockerDatabase() {
  if (quiet('docker', ['version', '--format', '{{.Server.Version}}']).status !== 0) return null
  const running = quiet('docker', ['ps', '--filter', `name=^${CONTAINER}$`, '--format', '{{.Names}}']).stdout.trim()
  if (!running) {
    quiet('docker', ['rm', '-f', CONTAINER])
    const started = quiet('docker', ['run', '-d', '--name', CONTAINER, '-e', 'POSTGRES_USER=test', '-e', 'POSTGRES_PASSWORD=test', '-e', 'POSTGRES_DB=test', '-p', `${PORT}:5432`, 'postgres:16-alpine'])
    if (started.status !== 0) {
      console.error(`test:integration: docker could not start ${CONTAINER} on port ${PORT}: ${said(started)}`)
      return null
    }
  }
  for (let i = 0; i < 30; i++) {
    // over TCP, not the socket: the image's init phase answers on the socket before it listens
    if (quiet('docker', ['exec', CONTAINER, 'pg_isready', '-h', 'localhost', '-U', 'test', '-q']).status === 0) return LOCAL_URL
    spawnSync(process.execPath, ['-e', 'setTimeout(() => {}, 1000)'])
  }
  return null
}

const url = process.env.TEST_DATABASE_URL || dockerDatabase()
if (!url) {
  console.error('test:integration: no database. Set TEST_DATABASE_URL, or start Docker for a throwaway Postgres.')
  process.exit(1)
}
const env = { TEST_DATABASE_URL: url, DATABASE_URL: url, PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true' }
if (run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], env).status !== 0) process.exit(1)
process.exit(run('pnpm', ['exec', 'vitest', 'run', '-c', 'vitest.integration.config.ts'], env).status ?? 1)
