// e2e/session.ts
// A signed-in session for the browser suite, through the real two-step sign-in: the first step
// stores a random code and mails it (nothing is sent without a Resend key); the test then writes
// a code it knows over the stored one, the way the mail would have told the user, and submits
// it. The app is not weakened for the test: an audit account has the second factor on unless the
// test asks for it off, and the credentials callback still refuses such a sign-in without a
// pending code. Each test signs in as an account of its own (created here, removed after), so
// two workers never race on one row's code. The client reads DATABASE_URL like the
// server under test (dotenv, as prisma.config.ts does).
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { expect, type Locator, type Page } from '@playwright/test'
import { PrismaClient } from '../generated/prisma/client'

export type Portal = 'admin' | 'manager'

/** The password every audit account is made with; a test that changes it signs in with its own. */
export const PASSWORD = 'audit-only'
const CODE = '246810'
const SEEDED_SLUG = 'foodify-test-kitchen'

let client: PrismaClient | null = null
/** One client per test process, on the database the server under test uses. */
export function db(): PrismaClient {
  if (!client) client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }) })
  return client
}

/** The seeded rows the audit navigates to: the restaurant (its uuid and the short code its pages are addressed by), one of its dishes, the seeded admin and manager. */
export async function seededIds() {
  const restaurant = await db().restaurant.findUniqueOrThrow({ where: { slug: SEEDED_SLUG }, select: { id: true, code: true } })
  const dish = await db().dish.findFirstOrThrow({ where: { restaurantId: restaurant.id }, orderBy: { sortOrder: 'asc' }, select: { id: true } })
  const admin = await db().user.findFirstOrThrow({ where: { role: 'SUPER_ADMIN', email: { not: { startsWith: 'audit-' } } }, select: { id: true } })
  // The role, not just "attached to the restaurant": a device account made by a staff spec is
  // attached too, and one picked here is deleted under the page that is reading it.
  const manager = await db().user.findFirstOrThrow({ where: { role: 'RESTAURANT_ADMIN', restaurants: { some: { id: restaurant.id } }, email: { not: { startsWith: 'audit-' } } }, select: { id: true } })
  return { restaurantId: restaurant.id, restaurantCode: restaurant.code, dishId: dish.id, adminId: admin.id, managerId: manager.id }
}

/**
 * An account for this test alone (its name carries the portal and a tag, the worker's project),
 * with the second factor on unless `mfa` is false; a manager manages the seeded restaurant, or
 * `restaurantId` when the test brings its own. `remove` deletes it.
 */
export async function auditAccount(portal: Portal, tag: string, { mfa = true, restaurantId }: { mfa?: boolean; restaurantId?: string } = {}) {
  const email = `audit-${portal}-${tag.replace(/[^a-z0-9]/gi, '')}@foodify.test`
  const restaurant = restaurantId ? { id: restaurantId } : await db().restaurant.findUniqueOrThrow({ where: { slug: SEEDED_SLUG }, select: { id: true } })
  await db().user.deleteMany({ where: { email } })
  await db().user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
      mfaEnabled: mfa,
      role: portal === 'admin' ? 'SUPER_ADMIN' : 'RESTAURANT_ADMIN',
      ...(portal === 'manager' ? { restaurants: { connect: { id: restaurant.id } } } : {}),
    },
  })
  return { email, remove: () => db().user.deleteMany({ where: { email } }) }
}

/**
 * Clicks `submit` until the form has answered (`arrived`). A click that lands before the page has
 * hydrated does nothing at all, and the first page a freshly started server renders under a full
 * gate's load hydrates late; so the click is repeated, never while the form is already answering
 * (`arrived` is checked first), until the form moves on or twenty seconds pass.
 */
export async function submitUntil(submit: Locator, arrived: () => Promise<boolean>) {
  await expect(async () => {
    if (!(await arrived())) await submit.click({ timeout: 2_000 })
    await expect.poll(arrived, { timeout: 3_000 }).toBe(true)
  }).toPass({ timeout: 20_000 })
}

/**
 * Signs the page in through the portal's sign-in flow as `email` (an audit account) and lands on
 * the portal; with `mfa` false the password alone is expected to do it. Where exactly it lands is
 * the portal's business — an admin gets the overview, a manager with one restaurant is sent
 * straight into that restaurant — so what is asserted is that it is inside the portal, is not the
 * login page under it (navigating away earlier aborts the sign-in request and no cookie is ever
 * set), and has rendered a page rather than an error.
 */
export async function signInAs(page: Page, portal: Portal, email: string, { mfa = true } = {}) {
  await page.goto(`/${portal}/login`)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(PASSWORD)
  const code = page.getByLabel(/code/i)
  const answered = mfa ? () => code.isVisible() : async () => !/\/(login|mfa)/.test(page.url())
  await submitUntil(page.getByRole('button', { name: /sign in|continue|log in/i }), answered)
  if (mfa) {
    await db().user.update({ where: { email }, data: { emailOtpCode: CODE, emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000) } })
    await code.fill(CODE)
    await page.getByRole('button', { name: /^sign in$/i }).click()
  }
  // One assertion, not two: Playwright retries until it holds, and `/{portal}/login` satisfies a
  // bare "inside the portal" the moment it is clicked, before the sign-in has navigated anywhere.
  await expect(page).toHaveURL(new RegExp(`/${portal}/(?!login|mfa)|/${portal}$`))
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}
