// Unit suite: pure modules under lib/, colocated `*.test.ts` (TEST.1). Coverage is a floor per
// area, pinned at the figure measured when the floor was set and only ever raised (TEST.4,
// FLOW.3); every exclusion below is listed with its reason in docs/TESTING.md. Never add
// `thresholds.autoUpdate`: the direction check refuses it, and a raise is a reviewed change.
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // e2e/ is Playwright's (its specs call test.describe from @playwright/test).
    // tests/integration is the database suite's (vitest.integration.config.ts, a real Postgres).
    // `.claude/**` is the agent harness, not source. It can hold a git worktree of this same
    // repository, and a worktree carries a full copy of the test suite — which the runner would
    // otherwise collect and run a second time, against another branch's code, out of its own
    // checkout. Git ignores those paths; a filesystem glob does not.
    exclude: [...configDefaults.exclude, 'e2e/**', 'tests/**', '.claude/**'],
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text-summary', 'json-summary'],
      include: ['lib/**/*.ts', 'server/**/*.ts'],
      exclude: [
        'lib/**/*.test.ts',
        'server/**/*.test.ts',
        'lib/prisma.ts', // client singleton, no logic
        'lib/cloudinary.ts', // SDK wrapper over the network: integration, not unit
        'lib/auth-guard.ts', // needs a session and Postgres: the phase-10 integration suite
        'lib/restaurant-loader.ts', // the same guard over the same database: tests/integration/order-board.test.ts
        'lib/insights-loader.ts', // grouped SQL over the same database: tests/integration/insights.test.ts
        'lib/insights-queries.ts', // the loader's SQL, split out of it: the same integration suite
        'lib/table-tab-loader.ts', // a table's bill read from the database: tests/integration/order-additions.test.ts
        'server/order-store.ts', // the order's transaction and the bill's row lock: the same integration suite
        'server/order-lock.ts', // a row lock taken in SQL: tests/integration/bill-lifecycle.test.ts and ticket-changes.test.ts
        'server/ticket-apply.ts', // a ticket's removal written under that lock: tests/integration/ticket-changes.test.ts
        'server/ticket-changes.ts', // the floor's changes and the kitchen's answers, in transactions: the same suite
        'server/bill-merge.ts', // merge and undo, in transactions: tests/integration/bill-lifecycle.test.ts
        'server/bill-changes.ts', // close and move, in transactions: the same suite
        'server/change-log.ts', // a manager's read of the change log: tests/integration/ticket-changes.test.ts
        'server/order-moves.ts', // the board's moves under the ticket's lock: tests/integration/ticket-changes.test.ts and order-board.test.ts
        'server/pos/connection.ts', // a stored connection opened into its adapter: tests/integration/pos-setup.test.ts
        'server/pos/setup.ts', // connect, test and choose a location, over the database: the same suite
        'server/pos/mapping.ts', // the dishes matched to the POS's items, over the database: the same suite
        'server/pos/control.ts', // activate, pause, resume, retry, disconnect: the same suite and pos-delivery.test.ts
        'server/pos/view.ts', // the Integrations tab's reading of the connection: tests/integration/pos-setup.test.ts
        'server/pos/enqueue.ts', // an outbox row written in the event's transaction: tests/integration/pos-outbox.test.ts
        'server/pos/claim.ts', // the claim's SQL, SKIP LOCKED over two connections: tests/integration/pos-delivery.test.ts
        'server/pos/payloads.ts', // what a row says, read from the orders: the same suite
        'server/pos/deliver.ts', // the sweep and the answers it records: the same suite
        'server/pos/webhook.ts', // a webhook verified, deduplicated and applied: tests/integration/pos-webhook.test.ts
        'lib/emails/**', // HTML templates: presentational
      ],
      thresholds: {
        // The shared layer. Set from `vitest run --coverage` on 2026-09-20, raised to the measured
        // figure on 2026-09-21 (phase 10) and twice on 2026-09-22 — the insights report's
        // arithmetic, then the roles, order serializer and staff schema that shipped untested and
        // were caught by the changed-lines gate. Branches are what bind. Raise when the number
        // does, never lower.
        'lib/**': { branches: 94.5, functions: 99.1, lines: 99.3, statements: 98.9 },
        // The process's modules (phase 13): the logger's redaction and the drain are the two things
        // that must never regress unseen; measured at 100 on 2026-09-21 and pinned there.
        'server/**': { branches: 100, functions: 100, lines: 100, statements: 100 },
        // Money display and the 2FA check get their own floor (TEST.4: per-file for money and
        // legal logic), so a drop there cannot hide behind a gain elsewhere in lib/.
        'lib/menu.ts': { branches: 85, functions: 63.6, lines: 86.2, statements: 88.8, perFile: true },
        'lib/totp.ts': { branches: 100, functions: 100, lines: 100, statements: 100, perFile: true },
      },
    },
  },
})
