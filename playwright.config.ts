// playwright.config.ts
// The browser suite (TEST.3): the critical journeys of the public menu and the sign-in page, with
// an axe scan on each (A11Y.1). It runs against the production build served by `pnpm start` on
// port 3100 so what is tested is what ships; `pnpm build` runs first (the gate does both).
// A phone viewport is a project, not a branch; retries 0 locally and 2 in CI; a trace on the
// first retry, screenshots on failure only. Test data is the seeded restaurant (prisma/seed.ts).
import { defineConfig, devices } from '@playwright/test'

const port = 3100
const ci = Boolean(process.env.CI)

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  workers: ci ? 2 : undefined,
  reporter: ci ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `http://localhost:${port}/offline`,
    reuseExistingServer: !ci,
    timeout: 60_000,
    env: { AUTH_TRUST_HOST: 'true', NEXTAUTH_URL: `http://localhost:${port}`, PORT: String(port) },
  },
})
