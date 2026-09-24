'use server'

import prisma from '@/lib/prisma'
import { requireBoardAccess, requireBoardAction, requireUser } from '@/lib/auth-guard'
import { pushEndpointInput, pushSubscriptionInput, type PushEndpointInput, type PushSubscriptionInput } from '@/lib/schemas/push'

/**
 * Someone who works this restaurant's service, for the app they are subscribing: a kitchen board
 * (`board`) takes whoever may move its orders — a tablet, a manager, a super admin, never a waiter;
 * the waiter's app (`waiter`) takes anyone assigned to the restaurant. Parses
 * `pushSubscriptionInput` (the endpoint must be a known push service: the server will POST to it)
 * and stores the subscription against the caller. One row per endpoint: a device that subscribes
 * again, signed in as someone else or for another restaurant, moves its row rather than adding
 * one, so it is never woken for a restaurant it has left. Answers `{ saved: true }`.
 */
export async function savePushSubscription(raw: PushSubscriptionInput): Promise<{ saved: true }> {
  await requireUser()
  const { restaurantId, app, subscription } = pushSubscriptionInput.parse(raw)
  // Which restaurant and which app decide the second guard, so it follows the parse.
  const user = await (app === 'waiter' ? requireBoardAccess(restaurantId) : requireBoardAction(restaurantId))
  const row = { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, app, userId: user.id, restaurantId }
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { endpoint: subscription.endpoint, ...row },
    update: row,
    select: { id: true },
  })
  return { saved: true }
}

/**
 * Anyone signed in, on their own device only: parses `pushEndpointInput` and deletes that
 * endpoint's row when it belongs to the caller (a device switching push off, or signing out). An
 * endpoint that is someone else's, or unknown, is left alone and answers `{ removed: false }`.
 */
export async function removePushSubscription(raw: PushEndpointInput): Promise<{ removed: boolean }> {
  const user = await requireUser()
  const { endpoint } = pushEndpointInput.parse(raw)
  const { count } = await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } })
  return { removed: count > 0 }
}
