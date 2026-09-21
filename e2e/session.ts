// e2e/session.ts
// A signed-in session for the browser suite, through the real two-step sign-in: the first step
// stores a random code and mails it (nothing is sent without a Resend key); the test then writes
// a code it knows over the stored one, the way the mail would have told the user, and submits
// it. The app is not weakened for the test: the credentials callback still refuses a sign-in
// without a pending code. Each test signs in as an account of its own (created here, removed
// after), so two workers never race on one row's code. The client reads DATABASE_URL like the
// server under test (dotenv, as prisma.config.ts does).
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { expect, type Page } from '@playwright/test'
import { PrismaClient } from '../generated/prisma/client'

export type Portal = 'admin' | 'manager'

const PASSWORD = 'audit-only'
const CODE = '246810'
const SEEDED_SLUG = 'foodify-test-kitchen'

let client: PrismaClient | null = null
/** One client per test process, on the database the server under test uses. */
export function db(): PrismaClient {
  if (!client) client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }) })
  return client
}

/** The seeded rows the audit navigates to: the restaurant, one of its dishes, the seeded admin and manager. */
export async function seededIds() {
  const restaurant = await db().restaurant.findUniqueOrThrow({ where: { slug: SEEDED_SLUG }, select: { id: true } })
  const dish = await db().dish.findFirstOrThrow({ where: { restaurantId: restaurant.id }, orderBy: { sortOrder: 'asc' }, select: { id: true } })
  const admin = await db().user.findFirstOrThrow({ where: { role: 'SUPER_ADMIN', email: { not: { startsWith: 'audit-' } } }, select: { id: true } })
  const manager = await db().user.findFirstOrThrow({ where: { restaurants: { some: { id: restaurant.id } }, email: { not: { startsWith: 'audit-' } } }, select: { id: true } })
  return { restaurantId: restaurant.id, dishId: dish.id, adminId: admin.id, managerId: manager.id }
}

/** An account for this test alone (its name carries the portal and a tag, the worker's project); `remove` deletes it. */
export async function auditAccount(portal: Portal, tag: string) {
  const email = `audit-${portal}-${tag.replace(/[^a-z0-9]/gi, '')}@foodify.test`
  const restaurant = await db().restaurant.findUniqueOrThrow({ where: { slug: SEEDED_SLUG }, select: { id: true } })
  await db().user.deleteMany({ where: { email } })
  await db().user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
      role: portal === 'admin' ? 'SUPER_ADMIN' : 'RESTAURANT_ADMIN',
      ...(portal === 'manager' ? { restaurants: { connect: { id: restaurant.id } } } : {}),
    },
  })
  return { email, remove: () => db().user.deleteMany({ where: { email } }) }
}

/** Signs the page in through the portal's sign-in flow as `email` (an audit account) and lands on its home. */
export async function signInAs(page: Page, portal: Portal, email: string) {
  await page.goto(`/${portal}/login`)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|continue|log in/i }).click()
  const code = page.getByLabel(/code/i)
  await expect(code).toBeVisible()
  await db().user.update({ where: { email }, data: { emailOtpCode: CODE, emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000) } })
  await code.fill(CODE)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  // The home, not the login page under it: navigating away earlier aborts the sign-in request and no cookie is ever set.
  await expect(page).toHaveURL(new RegExp(`/${portal}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview')
}
