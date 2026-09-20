// Unit suite: pure modules under lib/, colocated `*.test.ts` (TEST.1). Coverage is a floor per
// area, pinned at the figure measured when the floor was set and only ever raised (TEST.4,
// FLOW.3); every exclusion below is listed with its reason in docs/TESTING.md. Never add
// `thresholds.autoUpdate`: the direction check refuses it, and a raise is a reviewed change.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text-summary', 'json-summary'],
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/*.test.ts',
        'lib/prisma.ts', // client singleton, no logic
        'lib/cloudinary.ts', // SDK wrapper over the network: integration, not unit
        'lib/auth-guard.ts', // needs a session and Postgres: the phase-10 integration suite
        'lib/emails/**', // HTML templates: presentational
      ],
      thresholds: {
        // The shared layer. Set from `vitest run --coverage` on 2026-09-20; branches and
        // functions are what bind. Raise when the number does, never lower.
        'lib/**': { branches: 79.7, functions: 79.4, lines: 92.5, statements: 92.4 },
      },
    },
  },
})
