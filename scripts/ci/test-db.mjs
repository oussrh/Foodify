// scripts/ci/test-db.mjs
// The throwaway Postgres both local suites run on: one Docker container on port 5499, left running
// for the next run, holding one database per suite (`test` for the integration suite, `e2e` for
// the browser suite) so neither sees the other's rows. Never the database `.env` names: that one
// is shared with a developer's own work, and a suite that writes accounts and orders into it, or
// reads whatever someone last saved there, is wrong both ways.
import { spawnSync } from 'node:child_process'

const CONTAINER = 'foodify-test-db'
const PORT = 5499

/** Runs a command with the output on this terminal and `env` over the current environment. */
export const run = (cmd, args, env = {}) => spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } })
const quiet = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' })
// What docker said when it refused, so a pull failure or a taken port is not read as "no Docker".
const said = (r) => (r.stderr || r.stdout || '').trim()

function startContainer(who) {
  const running = quiet('docker', ['ps', '--filter', `name=^${CONTAINER}$`, '--format', '{{.Names}}']).stdout.trim()
  if (running) return true
  quiet('docker', ['rm', '-f', CONTAINER])
  const started = quiet('docker', ['run', '-d', '--name', CONTAINER, '-e', 'POSTGRES_USER=test', '-e', 'POSTGRES_PASSWORD=test', '-e', 'POSTGRES_DB=test', '-p', `${PORT}:5432`, 'postgres:16-alpine'])
  if (started.status !== 0) console.error(`${who}: docker could not start ${CONTAINER} on port ${PORT}: ${said(started)}`)
  return started.status === 0
}

function waitReady() {
  for (let i = 0; i < 30; i++) {
    // over TCP, not the socket: the image's init phase answers on the socket before it listens
    if (quiet('docker', ['exec', CONTAINER, 'pg_isready', '-h', 'localhost', '-U', 'test', '-q']).status === 0) return true
    spawnSync(process.execPath, ['-e', 'setTimeout(() => {}, 1000)'])
  }
  return false
}

/**
 * The URL of database `name` in the throwaway container, started (and the database created) when
 * missing; null when Docker is not there to ask. `who` names the suite in any message.
 */
export function dockerDatabase(name, who) {
  if (quiet('docker', ['version', '--format', '{{.Server.Version}}']).status !== 0) return null
  if (!startContainer(who) || !waitReady()) return null
  if (name !== 'test') {
    // No SQL here: on Windows the command goes through a shell that splits a quoted query at its
    // spaces. `createdb` either makes the database or says it is already there, and both are fine.
    const created = quiet('docker', ['exec', CONTAINER, 'createdb', '-U', 'test', name])
    if (created.status !== 0 && !/already exists/.test(said(created))) {
      console.error(`${who}: could not create the ${name} database: ${said(created)}`)
      return null
    }
  }
  return `postgresql://test:test@localhost:${PORT}/${name}`
}
